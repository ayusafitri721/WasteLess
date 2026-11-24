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

const VALID_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==';

const account = {
  name: 'Dapur Avatar',
  email: 'avatar@wasteless.test',
  password: 'password123',
  role: 'provider',
  organizationName: 'Dapur Avatar',
};

let mongoServer;
let app;
let User;
let disconnectDatabase;
let token;

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
  await request(app).post('/api/auth/register').send(account);
  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: account.email, password: account.password });
  token = login.body.data.token;
});

function patch(body) {
  return request(app)
    .patch('/api/users/me')
    .set('Authorization', `Bearer ${token}`)
    .send(body);
}

function dataUrl(mime, buffer) {
  return `data:${mime};base64,${buffer.toString('base64')}`;
}

function pngWithWidth(width) {
  const buffer = Buffer.from(VALID_PNG.split(',')[1], 'base64');
  buffer.writeUInt32BE(width, 16);
  return dataUrl('image/png', buffer);
}

describe('Avatar profil', () => {
  it('menerima PNG valid dan menyimpannya', async () => {
    const response = await patch({ avatar: VALID_PNG });

    assert.equal(response.status, 200);
    assert.equal(response.body.data.user.avatar, VALID_PNG);

    const stored = await User.findOne({ email: account.email });
    assert.equal(stored.avatar, VALID_PNG);
  });

  it('menghapus avatar dengan null', async () => {
    await patch({ avatar: VALID_PNG });
    const response = await patch({ avatar: null });

    assert.equal(response.status, 200);
    assert.equal(response.body.data.user.avatar, null);
  });

  it('menolak MIME selain PNG dan JPEG', async () => {
    const response = await patch({
      avatar: dataUrl('image/svg+xml', Buffer.from('<svg></svg>')),
    });

    assert.equal(response.status, 422);
    assert.equal(response.body.error.code, 'VALIDATION_ERROR');
  });

  it('menolak data yang bukan benar-benar PNG', async () => {
    const response = await patch({
      avatar: dataUrl('image/png', Buffer.from('bukan gambar')),
    });

    assert.equal(response.status, 422);
  });

  it('menolak base64 yang tidak kanonik', async () => {
    const response = await patch({
      avatar: 'data:image/png;base64,!!!',
    });

    assert.equal(response.status, 422);
  });

  it('menolak dimensi melebihi batas', async () => {
    const response = await patch({ avatar: pngWithWidth(2000) });

    assert.equal(response.status, 422);
  });

  it('menolak JPEG berkas metadata APP1', async () => {
    const jpeg = Buffer.from([
      0xff, 0xd8, 0xff, 0xe1, 0x00, 0x08, 0x45, 0x78, 0x69, 0x66, 0x00, 0xff,
      0xd9,
    ]);

    const response = await patch({ avatar: dataUrl('image/jpeg', jpeg) });

    assert.equal(response.status, 422);
  });
});
