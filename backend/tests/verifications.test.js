import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
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
};

const receiver = {
  name: 'Yayasan Peduli',
  email: 'receiver@wasteless.test',
  password: 'password123',
  role: 'receiver',
  organizationName: 'Yayasan Peduli',
};

const submission = {
  organizationName: 'Dapur Berkah',
  contactPhone: '081234567890',
  supportingDocumentUrl: 'https://example.com/dokumen.pdf',
  notes: 'Mohon diverifikasi',
};

let mongoServer;
let app;
let User;
let Verification;
let ActivityLog;
let disconnectDatabase;

before(async () => {
  mongoServer = await MongoMemoryReplSet.create({
    replSet: { count: 1 },
  });
  await mongoServer.waitUntilRunning();

  const database = await import('../src/config/database.js');
  disconnectDatabase = database.disconnectDatabase;
  await database.connectDatabase(mongoServer.getUri());

  ({ default: app } = await import('../src/app.js'));
  ({ User } = await import('../src/modules/users/user.model.js'));
  ({ Verification } = await import(
    '../src/modules/verifications/verification.model.js'
  ));
  ({ ActivityLog } = await import(
    '../src/modules/activity-logs/activity-log.model.js'
  ));

  await User.init();
  await Verification.init();
});

after(async () => {
  await disconnectDatabase();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Verification.deleteMany({}),
    ActivityLog.deleteMany({}),
  ]);
});

async function registerAndLogin(payload) {
  const registerResponse = await request(app)
    .post('/api/auth/register')
    .send(payload);

  assert.equal(registerResponse.status, 201);

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({ email: payload.email, password: payload.password });

  assert.equal(loginResponse.status, 200);

  return {
    token: loginResponse.body.data.token,
    user: loginResponse.body.data.user,
  };
}

async function createAdmin() {
  await User.create({
    name: 'Administrator',
    email: 'admin@wasteless.test',
    passwordHash: await bcrypt.hash('password123', 12),
    role: 'admin',
    verificationStatus: 'verified',
  });

  const response = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@wasteless.test', password: 'password123' });

  assert.equal(response.status, 200);
  return response.body.data.token;
}

function submit(token, payload = submission) {
  return request(app)
    .post('/api/verifications')
    .set('Authorization', `Bearer ${token}`)
    .send(payload);
}

function listAsAdmin(token, query = '') {
  return request(app)
    .get(`/api/admin/verifications${query}`)
    .set('Authorization', `Bearer ${token}`);
}

function decideAsAdmin(token, id, payload) {
  return request(app)
    .patch(`/api/admin/verifications/${id}`)
    .set('Authorization', `Bearer ${token}`)
    .send(payload);
}

describe('Pengajuan verifikasi', () => {
  it('menyimpan pengajuan dan mengubah status pengguna menjadi pending', async () => {
    const { token } = await registerAndLogin(provider);

    const response = await submit(token);

    assert.equal(response.status, 201);
    assert.equal(response.body.data.verification.status, 'pending');
    assert.equal(
      response.body.data.verification.organizationName,
      submission.organizationName,
    );

    const user = await User.findOne({ email: provider.email });
    assert.equal(user.verificationStatus, 'pending');
    assert.equal(user.organizationName, submission.organizationName);
    assert.equal(user.phone, submission.contactPhone);

    const log = await ActivityLog.findOne({
      action: 'verification.submitted',
    });
    assert.ok(log);
    assert.equal(log.resourceId.toString(), response.body.data.verification.id);
  });

  it('menolak pengajuan kedua saat masih pending', async () => {
    const { token } = await registerAndLogin(provider);

    assert.equal((await submit(token)).status, 201);

    const response = await submit(token);

    assert.equal(response.status, 409);
    assert.equal(response.body.error.code, 'VERIFICATION_PENDING');
    assert.equal(await Verification.countDocuments(), 1);
  });

  it('menolak pengajuan jika akun sudah terverifikasi', async () => {
    const { token } = await registerAndLogin(provider);
    await User.updateOne(
      { email: provider.email },
      { $set: { verificationStatus: 'verified' } },
    );

    const response = await submit(token);

    assert.equal(response.status, 409);
    assert.equal(response.body.error.code, 'ALREADY_VERIFIED');
  });

  it('menolak admin mengajukan verifikasi', async () => {
    const token = await createAdmin();

    const response = await submit(token);

    assert.equal(response.status, 403);
    assert.equal(response.body.error.code, 'FORBIDDEN');
  });

  it('memvalidasi field pengajuan', async () => {
    const { token } = await registerAndLogin(provider);

    const response = await submit(token, {
      organizationName: 'A',
      contactPhone: '123',
      supportingDocumentUrl: 'javascript:alert(1)',
    });

    assert.equal(response.status, 422);
    assert.equal(response.body.error.code, 'VALIDATION_ERROR');
    const paths = response.body.error.details.map((detail) => detail.path);
    assert.ok(paths.includes('organizationName'));
    assert.ok(paths.includes('contactPhone'));
    assert.ok(paths.includes('supportingDocumentUrl'));
  });
});

describe('Pengelolaan verifikasi oleh admin', () => {
  it('menolak akses daftar pengajuan untuk non-admin', async () => {
    const { token } = await registerAndLogin(provider);

    const response = await listAsAdmin(token);

    assert.equal(response.status, 403);
    assert.equal(response.body.error.code, 'FORBIDDEN');
  });

  it('menampilkan pengajuan pending dengan pagination', async () => {
    const adminToken = await createAdmin();
    const first = await registerAndLogin(provider);
    const second = await registerAndLogin(receiver);

    await submit(first.token);
    await submit(second.token, {
      organizationName: 'Yayasan Peduli',
      contactPhone: '089876543210',
    });

    const response = await listAsAdmin(adminToken, '?limit=1&page=1');

    assert.equal(response.status, 200);
    assert.equal(response.body.data.items.length, 1);
    assert.equal(response.body.data.pagination.total, 2);
    assert.equal(response.body.data.pagination.totalPages, 2);
    assert.equal(response.body.data.items[0].userId.email, provider.email);

    const secondPage = await listAsAdmin(adminToken, '?limit=1&page=2');
    assert.equal(secondPage.body.data.items[0].userId.email, receiver.email);
  });

  it('menyetujui pengajuan dan memperbarui status pengguna', async () => {
    const adminToken = await createAdmin();
    const { token } = await registerAndLogin(provider);
    const submitted = await submit(token);

    const response = await decideAsAdmin(
      adminToken,
      submitted.body.data.verification.id,
      { decision: 'approved', reviewNote: 'Dokumen lengkap' },
    );

    assert.equal(response.status, 200);
    assert.equal(response.body.data.verification.status, 'approved');
    assert.ok(response.body.data.verification.reviewedBy);
    assert.ok(response.body.data.verification.reviewedAt);

    const user = await User.findOne({ email: provider.email });
    assert.equal(user.verificationStatus, 'verified');

    const log = await ActivityLog.findOne({
      action: 'verification.approved',
    });
    assert.ok(log);
  });

  it('mewajibkan alasan saat menolak dan mengizinkan pengajuan ulang', async () => {
    const adminToken = await createAdmin();
    const { token } = await registerAndLogin(provider);
    const submitted = await submit(token);
    const verificationId = submitted.body.data.verification.id;

    const withoutReason = await decideAsAdmin(adminToken, verificationId, {
      decision: 'rejected',
    });
    assert.equal(withoutReason.status, 422);

    const rejected = await decideAsAdmin(adminToken, verificationId, {
      decision: 'rejected',
      reviewNote: 'Dokumen tidak terbaca',
    });
    assert.equal(rejected.status, 200);
    assert.equal(rejected.body.data.verification.status, 'rejected');
    assert.equal(
      rejected.body.data.verification.reviewNote,
      'Dokumen tidak terbaca',
    );

    const user = await User.findOne({ email: provider.email });
    assert.equal(user.verificationStatus, 'rejected');

    const resubmitted = await submit(token);
    assert.equal(resubmitted.status, 201);
    assert.equal(resubmitted.body.data.verification.status, 'pending');
    assert.equal(await Verification.countDocuments(), 2);
  });

  it('menolak pemrosesan pengajuan yang sama dua kali', async () => {
    const adminToken = await createAdmin();
    const { token } = await registerAndLogin(provider);
    const submitted = await submit(token);
    const verificationId = submitted.body.data.verification.id;

    const first = await decideAsAdmin(adminToken, verificationId, {
      decision: 'approved',
    });
    assert.equal(first.status, 200);

    const second = await decideAsAdmin(adminToken, verificationId, {
      decision: 'rejected',
      reviewNote: 'Ubah keputusan',
    });

    assert.equal(second.status, 409);
    assert.equal(
      second.body.error.code,
      'VERIFICATION_ALREADY_PROCESSED',
    );
    assert.equal(
      await ActivityLog.countDocuments({ action: 'verification.approved' }),
      1,
    );
    assert.equal(
      await ActivityLog.countDocuments({ action: 'verification.rejected' }),
      0,
    );

    const user = await User.findOne({ email: provider.email });
    assert.equal(user.verificationStatus, 'verified');
  });

  it('mengembalikan 404 untuk pengajuan yang tidak ada', async () => {
    const adminToken = await createAdmin();

    const response = await decideAsAdmin(
      adminToken,
      '507f1f77bcf86cd799439011',
      { decision: 'approved' },
    );

    assert.equal(response.status, 404);
    assert.equal(response.body.error.code, 'VERIFICATION_NOT_FOUND');
  });
});
