import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET ?? 'test-secret-test-secret-test-secret-key';
process.env.MONGODB_URI =
  process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/wasteless_test';
process.env.CLIENT_ORIGIN =
  process.env.CLIENT_ORIGIN ?? 'http://localhost:3000';
process.env.SMTP_HOST = '';
process.env.SMTP_USER = '';
process.env.SMTP_PASS = '';

const account = {
  name: 'Dapur Berkah',
  email: 'reset@wasteless.test',
  password: 'password123',
  role: 'provider',
  organizationName: 'Dapur Berkah',
};

let mongoServer;
let app;
let User;
let disconnectDatabase;

function register() {
  return request(app).post('/api/auth/register').send(account);
}

function login(password = account.password) {
  return request(app)
    .post('/api/auth/login')
    .send({ email: account.email, password });
}

function requestReset(email = account.email) {
  return request(app).post('/api/auth/forgot-password').send({ email });
}

function reset(token, password = 'passwordBaru123') {
  return request(app).post('/api/auth/reset-password').send({ token, password });
}

before(async () => {
  mongoServer = await MongoMemoryServer.create();

  const database = await import('../src/config/database.js');
  disconnectDatabase = database.disconnectDatabase;
  await database.connectDatabase(mongoServer.getUri());

  ({ default: app } = await import('../src/app.js'));
  ({ User } = await import('../src/modules/users/user.model.js'));
  await User.init();
});

after(async () => {
  await disconnectDatabase();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('Permintaan reset password', () => {
  it('membuat token untuk email yang terdaftar', async () => {
    await register();
    const response = await requestReset();

    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.ok(response.body.data.resetToken);
    assert.ok(response.body.data.expiresAt);

    const stored = await User.findOne({ email: account.email }).select(
      '+passwordResetTokenHash +passwordResetExpiresAt',
    );
    assert.ok(stored.passwordResetTokenHash);
    assert.ok(stored.passwordResetExpiresAt);
    assert.notEqual(
      stored.passwordResetTokenHash,
      response.body.data.resetToken,
    );
  });

  it('tetap memberi respons sukses untuk email yang tidak terdaftar', async () => {
    const response = await requestReset('tidakada@wasteless.test');

    assert.equal(response.status, 200);
    assert.equal(response.body.data.resetToken, undefined);
    assert.match(response.body.data.message, /Jika email terdaftar/);
  });

  it('menolak format email yang tidak valid', async () => {
    const response = await requestReset('bukan-email');

    assert.equal(response.status, 422);
    assert.equal(response.body.error.code, 'VALIDATION_ERROR');
  });
});

describe('Penggantian password', () => {
  it('mengganti password dan menghapus token reset', async () => {
    await register();
    const { body } = await requestReset();
    const response = await reset(body.data.resetToken);

    assert.equal(response.status, 200);
    assert.equal(response.body.data.user.email, account.email);
    assert.equal(response.body.data.user.passwordHash, undefined);
    assert.equal(response.body.data.user.passwordResetTokenHash, undefined);

    const stored = await User.findOne({ email: account.email }).select(
      '+passwordResetTokenHash +passwordResetExpiresAt +passwordHash',
    );
    assert.equal(stored.passwordResetTokenHash, undefined);
    assert.equal(stored.passwordResetExpiresAt, undefined);
    assert.notEqual(stored.passwordHash, undefined);

    const oldLogin = await login();
    assert.equal(oldLogin.status, 401);
    const newLogin = await login('passwordBaru123');
    assert.equal(newLogin.status, 200);
  });

  it('menolak token yang sudah dipakai', async () => {
    await register();
    const { body } = await requestReset();

    const first = await reset(body.data.resetToken);
    assert.equal(first.status, 200);

    const second = await reset(body.data.resetToken);
    assert.equal(second.status, 400);
    assert.equal(second.body.error.code, 'INVALID_RESET_TOKEN');
  });

  it('menolak token yang kedaluwarsa', async () => {
    await register();
    const { body } = await requestReset();
    await User.updateOne(
      { email: account.email },
      { $set: { passwordResetExpiresAt: new Date(Date.now() - 1000) } },
    );

    const response = await reset(body.data.resetToken);
    assert.equal(response.status, 400);
    assert.equal(response.body.error.code, 'INVALID_RESET_TOKEN');
  });

  it('menolak token yang tidak dikenal', async () => {
    const response = await reset('token-palsu-yang-panjangnya-cukup-untuk-validasi');

    assert.equal(response.status, 400);
    assert.equal(response.body.error.code, 'INVALID_RESET_TOKEN');
  });

  it('mencabut token lama setelah password diganti', async () => {
    await register();
    const before = await login();
    const oldToken = before.body.data.token;
    const { body } = await requestReset();

    await reset(body.data.resetToken);

    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${oldToken}`);

    assert.equal(me.status, 401);
    assert.equal(me.body.error.code, 'TOKEN_REVOKED');
  });
});
