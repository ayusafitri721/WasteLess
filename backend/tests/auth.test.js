import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET ?? 'test-secret-test-secret-test-secret-key';
process.env.MONGODB_URI =
  process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/wasteless_test';
process.env.CLIENT_ORIGIN =
  process.env.CLIENT_ORIGIN ?? 'http://localhost:3000';

const provider = {
  name: 'Dapur Berkah',
  email: 'provider@wasteless.test',
  password: 'password123',
  role: 'provider',
  organizationName: 'Dapur Berkah',
};

const receiver = {
  name: 'Yayasan Peduli',
  email: 'receiver@wasteless.test',
  password: 'password123',
  role: 'receiver',
  organizationName: 'Yayasan Peduli',
};

let mongoServer;
let app;
let User;
let disconnectDatabase;

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

function register(payload = provider) {
  return request(app).post('/api/auth/register').send(payload);
}

async function createAndLogin(payload = provider) {
  await register(payload);
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email: payload.email, password: payload.password });

  assert.equal(response.status, 200);
  return response.body.data.token;
}

describe('Registrasi', () => {
  it('membuat akun dan menyimpan password sebagai hash', async () => {
    const response = await register();

    assert.equal(response.status, 201);
    assert.equal(response.body.success, true);
    assert.equal(response.body.data.user.email, provider.email);
    assert.equal(response.body.data.user.role, 'provider');
    assert.equal(response.body.data.user.verificationStatus, 'unverified');
    assert.equal(response.body.data.user.passwordHash, undefined);

    const stored = await User.findOne({ email: provider.email }).select(
      '+passwordHash',
    );
    assert.ok(stored);
    assert.notEqual(stored.passwordHash, provider.password);
    assert.match(stored.passwordHash, /^\$2[aby]\$/);
    assert.equal(
      await bcrypt.compare(provider.password, stored.passwordHash),
      true,
    );
  });

  it('menormalkan email menjadi huruf kecil', async () => {
    const response = await register({
      ...provider,
      email: 'Provider@WasteLess.Test',
    });

    assert.equal(response.status, 201);
    assert.equal(response.body.data.user.email, 'provider@wasteless.test');

    const stored = await User.findOne({ email: 'provider@wasteless.test' });
    assert.ok(stored);
  });

  it('menolak email yang sudah terdaftar', async () => {
    await register();
    const response = await register();

    assert.equal(response.status, 409);
    assert.equal(response.body.error.code, 'EMAIL_TAKEN');
  });

  it('menolak registrasi dengan role admin', async () => {
    const response = await register({ ...provider, role: 'admin' });

    assert.equal(response.status, 422);
    assert.equal(response.body.error.code, 'VALIDATION_ERROR');
  });

  it('menolak receiver tanpa organizationName', async () => {
    const { organizationName, ...payload } = receiver;
    const response = await register(payload);

    assert.equal(response.status, 422);
    assert.equal(response.body.error.code, 'VALIDATION_ERROR');
    assert.ok(
      response.body.error.details.some(
        (detail) => detail.path === 'organizationName',
      ),
    );
  });

  it('menolak field yang tidak dikenal', async () => {
    const response = await register({ ...provider, isAdmin: true });

    assert.equal(response.status, 422);
    assert.equal(response.body.error.code, 'VALIDATION_ERROR');
  });

  it('menolak password yang terlalu pendek', async () => {
    const response = await register({ ...provider, password: 'pendek' });

    assert.equal(response.status, 422);
    assert.equal(response.body.error.code, 'VALIDATION_ERROR');
  });
});

describe('Login', () => {
  it('mengembalikan token dan data pengguna', async () => {
    await register();

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: provider.email, password: provider.password });

    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.equal(response.body.data.user.email, provider.email);
    assert.equal(response.body.data.user.passwordHash, undefined);
    assert.equal(typeof response.body.data.token, 'string');
    assert.ok(response.body.data.token.length > 20);
  });

  it('menolak password yang salah', async () => {
    await register();

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: provider.email, password: 'password-salah' });

    assert.equal(response.status, 401);
    assert.equal(response.body.error.code, 'INVALID_CREDENTIALS');
  });

  it('memberi respons yang sama untuk email yang tidak terdaftar', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'tidak-ada@wasteless.test', password: 'password123' });

    assert.equal(response.status, 401);
    assert.equal(response.body.error.code, 'INVALID_CREDENTIALS');
  });
});

describe('Profil pengguna', () => {
  it('menolak akses tanpa token', async () => {
    const response = await request(app).get('/api/auth/me');

    assert.equal(response.status, 401);
    assert.equal(response.body.error.code, 'UNAUTHENTICATED');
  });

  it('menolak token yang tidak valid', async () => {
    const response = await request(app)
      .get('/api/users/me')
      .set('Authorization', 'Bearer token-palsu');

    assert.equal(response.status, 401);
    assert.equal(response.body.error.code, 'INVALID_TOKEN');
  });

  it('mengembalikan profil pengguna yang sedang login', async () => {
    const token = await createAndLogin();

    const response = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${token}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.data.user.email, provider.email);
    assert.equal(response.body.data.user.passwordHash, undefined);
  });

  it('memperbarui field profil yang diizinkan', async () => {
    const token = await createAndLogin();

    const response = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Dapur Berkah Baru', phone: '081234567890' });

    assert.equal(response.status, 200);
    assert.equal(response.body.data.user.name, 'Dapur Berkah Baru');
    assert.equal(response.body.data.user.phone, '081234567890');

    const stored = await User.findById(response.body.data.user.id);
    assert.equal(stored.name, 'Dapur Berkah Baru');
  });

  it('menolak perubahan role dan status verifikasi', async () => {
    const token = await createAndLogin();

    const roleResponse = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'admin' });

    assert.equal(roleResponse.status, 422);

    const verificationResponse = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ verificationStatus: 'verified' });

    assert.equal(verificationResponse.status, 422);

    const stored = await User.findOne({ email: provider.email });
    assert.equal(stored.role, 'provider');
    assert.equal(stored.verificationStatus, 'unverified');
  });

  it('menolak update profil kosong', async () => {
    const token = await createAndLogin();

    const response = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    assert.equal(response.status, 422);
    assert.equal(response.body.error.code, 'VALIDATION_ERROR');
  });

  it('logout membatalkan token yang sedang dipakai', async () => {
    const token = await createAndLogin();

    const response = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    assert.equal(response.status, 204);
    assert.equal(response.text, '');

    const revoked = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${token}`);

    assert.equal(revoked.status, 401);
    assert.equal(revoked.body.error.code, 'TOKEN_REVOKED');

    const relogin = await request(app)
      .post('/api/auth/login')
      .send({ email: provider.email, password: provider.password });

    assert.equal(relogin.status, 200);

    const withNewToken = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${relogin.body.data.token}`);

    assert.equal(withNewToken.status, 200);
  });
});
