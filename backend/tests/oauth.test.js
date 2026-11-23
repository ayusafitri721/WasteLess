import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET ?? 'test-secret-test-secret-test-secret-key';
process.env.CLIENT_ORIGIN =
  process.env.CLIENT_ORIGIN ?? 'http://localhost:3000';
process.env.GOOGLE_CLIENT_ID = 'google-client';
process.env.GOOGLE_CLIENT_SECRET = 'google-secret';
process.env.GITHUB_CLIENT_ID = 'github-client';
process.env.GITHUB_CLIENT_SECRET = 'github-secret';
process.env.OAUTH_BACKEND_ORIGIN = 'http://localhost:5000';

let mongoServer;
let app;
let User;
let OAuthExchange;
let disconnectDatabase;
let fetchImpl;
const originalFetch = globalThis.fetch;

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function googleMocks() {
  fetchImpl = async (url) => {
    const target = String(url);
    if (target.includes('oauth2.googleapis.com/token')) {
      return jsonResponse({ access_token: 'google-access-token' });
    }
    if (target.includes('openidconnect.googleapis.com')) {
      return jsonResponse({
        sub: 'google-123',
        email: 'OAuth.User@Example.com',
        email_verified: true,
        name: 'OAuth User',
      });
    }
    throw new Error(`Permintaan tak terduga: ${target}`);
  };
}

function githubMocks() {
  fetchImpl = async (url) => {
    const target = String(url);
    if (target === 'https://github.com/login/oauth/access_token') {
      return jsonResponse({ access_token: 'github-access-token' });
    }
    if (target === 'https://api.github.com/user') {
      return jsonResponse({ id: 987, login: 'oauth-user', name: 'GitHub User' });
    }
    if (target === 'https://api.github.com/user/emails') {
      return jsonResponse([
        {
          email: 'github-user@example.com',
          primary: true,
          verified: true,
        },
      ]);
    }
    throw new Error(`Permintaan tak terduga: ${target}`);
  };
}

async function start(provider, role = 'receiver') {
  const response = await request(app).get(
    `/api/auth/oauth/${provider}/start?role=${role}`,
  );
  assert.equal(response.status, 302);
  return new URL(response.headers.location);
}

async function callback(provider, authorizationUrl, code = 'authorization-code') {
  return request(app).get(
    `/api/auth/oauth/${provider}/callback?code=${code}&state=${encodeURIComponent(
      authorizationUrl.searchParams.get('state'),
    )}`,
  );
}

function exchangeCodeFrom(response) {
  assert.equal(response.status, 302);
  const target = new URL(response.headers.location);
  assert.equal(target.pathname, '/api/auth/oauth/callback');
  return target.searchParams.get('code');
}

before(async () => {
  mongoServer = await MongoMemoryServer.create();
  globalThis.fetch = (...args) => fetchImpl(...args);

  const database = await import('../src/config/database.js');
  disconnectDatabase = database.disconnectDatabase;
  await database.connectDatabase(mongoServer.getUri());

  ({ default: app } = await import('../src/app.js'));
  ({ User } = await import('../src/modules/users/user.model.js'));
  ({ OAuthExchange } = await import(
    '../src/modules/auth/oauth-exchange.model.js'
  ));
  await User.init();
  await OAuthExchange.init();
});

after(async () => {
  globalThis.fetch = originalFetch;
  await disconnectDatabase();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await OAuthExchange.deleteMany({});
  fetchImpl = async () => {
    throw new Error('fetch tidak di-mock untuk test ini');
  };
});

describe('OAuth start', () => {
  it('mengarahkan ke Google dengan state, client id, dan peran', async () => {
    const target = await start('google', 'provider');

    assert.equal(target.hostname, 'accounts.google.com');
    assert.equal(target.searchParams.get('client_id'), 'google-client');
    assert.equal(target.searchParams.get('response_type'), 'code');
    assert.equal(target.searchParams.get('scope'), 'openid email profile');
    assert.equal(
      target.searchParams.get('redirect_uri'),
      'http://localhost:5000/api/auth/oauth/google/callback',
    );
    assert.ok(target.searchParams.get('state'));
  });

  it('mengarahkan ke GitHub dengan scope user:email', async () => {
    const target = await start('github', 'receiver');

    assert.equal(
      `${target.hostname}${target.pathname}`,
      'github.com/login/oauth/authorize',
    );
    assert.equal(target.searchParams.get('scope'), 'user:email');
    assert.equal(target.searchParams.get('client_id'), 'github-client');
  });

  it('menolak provider yang tidak dikenal', async () => {
    const response = await request(app).get('/api/auth/oauth/facebook/start');
    assert.equal(response.status, 422);
    assert.equal(response.body.error.code, 'VALIDATION_ERROR');
  });

  it('menolak peran di luar enum', async () => {
    const response = await request(app).get(
      '/api/auth/oauth/google/start?role=admin',
    );
    assert.equal(response.status, 422);
  });
});

describe('OAuth callback Google', () => {
  it('membuat akun baru dan menukar kode sekali pakai menjadi token', async () => {
    googleMocks();
    const authorizationUrl = await start('google', 'provider');
    const callbackResponse = await callback('google', authorizationUrl);
    const code = exchangeCodeFrom(callbackResponse);

    const exchanged = await request(app)
      .post('/api/auth/oauth/exchange')
      .send({ code });

    assert.equal(exchanged.status, 200);
    assert.equal(exchanged.body.data.user.email, 'oauth.user@example.com');
    assert.equal(exchanged.body.data.user.name, 'OAuth User');
    assert.equal(exchanged.body.data.user.role, 'provider');
    assert.equal(exchanged.body.data.user.verificationStatus, 'unverified');
    assert.equal(exchanged.body.data.user.passwordHash, undefined);
    assert.ok(exchanged.body.data.token);

    const stored = await User.findOne({ email: 'oauth.user@example.com' });
    assert.equal(stored.oauthAccounts.length, 1);
    assert.equal(stored.oauthAccounts[0].provider, 'google');
    assert.equal(stored.oauthAccounts[0].providerAccountId, 'google-123');
  });

  it('menolak state yang dimodifikasi', async () => {
    const response = await request(app).get(
      '/api/auth/oauth/google/callback?code=abc&state=state-palsu',
    );

    assert.equal(response.status, 302);
    assert.match(response.headers.location, /s=oauth_failed/);
  });

  it('menghubungkan akun email yang sudah ada tanpa mengubah perannya', async () => {
    await User.create({
      name: 'Akun Lama',
      email: 'oauth.user@example.com',
      passwordHash: await bcrypt.hash('password123', 12),
      role: 'receiver',
      verificationStatus: 'verified',
    });

    googleMocks();
    const authorizationUrl = await start('google', 'provider');
    const code = exchangeCodeFrom(await callback('google', authorizationUrl));
    const exchanged = await request(app)
      .post('/api/auth/oauth/exchange')
      .send({ code });

    assert.equal(exchanged.status, 200);
    assert.equal(exchanged.body.data.user.role, 'receiver');
    assert.equal(exchanged.body.data.user.verificationStatus, 'verified');

    const stored = await User.findOne({ email: 'oauth.user@example.com' });
    assert.equal(stored.oauthAccounts.length, 1);
  });
});

describe('OAuth callback GitHub', () => {
  it('memakai email utama yang terverifikasi', async () => {
    githubMocks();
    const authorizationUrl = await start('github', 'receiver');
    const code = exchangeCodeFrom(await callback('github', authorizationUrl));

    const exchanged = await request(app)
      .post('/api/auth/oauth/exchange')
      .send({ code });

    assert.equal(exchanged.status, 200);
    assert.equal(exchanged.body.data.user.email, 'github-user@example.com');
    assert.equal(exchanged.body.data.user.name, 'GitHub User');
    assert.equal(exchanged.body.data.user.role, 'receiver');
  });
});

describe('OAuth exchange', () => {
  it('menolak kode yang sudah dipakai', async () => {
    googleMocks();
    const authorizationUrl = await start('google');
    const code = exchangeCodeFrom(await callback('google', authorizationUrl));

    const first = await request(app)
      .post('/api/auth/oauth/exchange')
      .send({ code });
    assert.equal(first.status, 200);

    const second = await request(app)
      .post('/api/auth/oauth/exchange')
      .send({ code });
    assert.equal(second.status, 400);
    assert.equal(second.body.error.code, 'OAUTH_INVALID_CODE');
  });

  it('menolak kode yang terlalu pendek', async () => {
    const response = await request(app)
      .post('/api/auth/oauth/exchange')
      .send({ code: 'pendek' });

    assert.equal(response.status, 422);
    assert.equal(response.body.error.code, 'VALIDATION_ERROR');
  });
});
