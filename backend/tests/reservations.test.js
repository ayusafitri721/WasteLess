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

const HOUR = 60 * 60 * 1000;

function isoFromNow(offset) {
  return new Date(Date.now() + offset).toISOString();
}

const providerA = {
  name: 'Dapur Berkah',
  email: 'provider-a@wasteless.test',
  password: 'password123',
  role: 'provider',
  organizationName: 'Dapur Berkah',
};

const providerB = {
  name: 'Roti Pagi',
  email: 'provider-b@wasteless.test',
  password: 'password123',
  role: 'provider',
  organizationName: 'Roti Pagi',
};

const receiverA = {
  name: 'Yayasan Peduli',
  email: 'receiver-a@wasteless.test',
  password: 'password123',
  role: 'receiver',
  organizationName: 'Yayasan Peduli',
};

const receiverB = {
  name: 'Komunitas Berbagi',
  email: 'receiver-b@wasteless.test',
  password: 'password123',
  role: 'receiver',
  organizationName: 'Komunitas Berbagi',
};

const validListing = {
  name: 'Nasi Box Sisa Acara',
  description: 'Nasi box berlebih dari acara kantor, masih layak konsumsi.',
  category: 'makanan_matang',
  quantity: 20,
  unit: 'porsi',
  productionDate: isoFromNow(-2 * HOUR),
  pickupDeadline: isoFromNow(8 * HOUR),
  pickupAddress: 'Jl. Contoh No. 1, Bandung',
};

let mongoServer;
let app;
let User;
let FoodListing;
let Reservation;
let ActivityLog;
let disconnectDatabase;

before(async () => {
  mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoServer.waitUntilRunning();

  const database = await import('../src/config/database.js');
  disconnectDatabase = database.disconnectDatabase;
  await database.connectDatabase(mongoServer.getUri());

  ({ default: app } = await import('../src/app.js'));
  ({ User } = await import('../src/modules/users/user.model.js'));
  ({ FoodListing } = await import('../src/modules/foods/food.model.js'));
  ({ Reservation } = await import(
    '../src/modules/reservations/reservation.model.js'
  ));
  ({ ActivityLog } = await import(
    '../src/modules/activity-logs/activity-log.model.js'
  ));

  await User.init();
  await FoodListing.init();
  await Reservation.init();
});

after(async () => {
  await disconnectDatabase();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    FoodListing.deleteMany({}),
    Reservation.deleteMany({}),
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

  return loginResponse.body.data.token;
}

async function registerVerified(payload) {
  const token = await registerAndLogin(payload);
  await User.updateOne(
    { email: payload.email },
    { $set: { verificationStatus: 'verified' } },
  );
  return token;
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

function createListing(token, overrides = {}) {
  return request(app)
    .post('/api/foods')
    .set('Authorization', `Bearer ${token}`)
    .send({ ...validListing, ...overrides });
}

function reserve(token, listingId, quantity, extra = {}) {
  return request(app)
    .post('/api/reservations')
    .set('Authorization', `Bearer ${token}`)
    .send({ listingId, quantity, ...extra });
}

function approve(token, id, payload = {}) {
  return request(app)
    .patch(`/api/reservations/${id}/approve`)
    .set('Authorization', `Bearer ${token}`)
    .send(payload);
}

function reject(token, id, payload = {}) {
  return request(app)
    .patch(`/api/reservations/${id}/reject`)
    .set('Authorization', `Bearer ${token}`)
    .send(payload);
}

function cancel(token, id, payload = {}) {
  return request(app)
    .patch(`/api/reservations/${id}/cancel`)
    .set('Authorization', `Bearer ${token}`)
    .send(payload);
}

function listMine(token, query = '') {
  return request(app)
    .get(`/api/reservations/my${query}`)
    .set('Authorization', `Bearer ${token}`);
}

function detail(token, id) {
  return request(app)
    .get(`/api/reservations/${id}`)
    .set('Authorization', `Bearer ${token}`);
}

describe('Pembuatan reservasi', () => {
  it('receiver terverifikasi dapat reservasi dan stok berkurang atomik', async () => {
    const providerToken = await registerVerified(providerA);
    const receiverToken = await registerVerified(receiverA);
    const listing = await createListing(providerToken);
    const listingId = listing.body.data.listing.id;

    const response = await reserve(receiverToken, listingId, 5);

    assert.equal(response.status, 201);
    assert.equal(response.body.data.reservation.status, 'pending');
    assert.equal(response.body.data.reservation.quantity, 5);
    assert.equal(
      response.body.data.reservation.listingId,
      listingId,
    );

    const storedListing = await FoodListing.findById(listingId);
    assert.equal(storedListing.availableQuantity, 15);
    assert.equal(storedListing.quantity, 20);
    assert.equal(storedListing.status, 'available');

    const log = await ActivityLog.findOne({
      action: 'reservation.created',
    });
    assert.ok(log);
  });

  it('menolak receiver yang belum terverifikasi', async () => {
    const providerToken = await registerVerified(providerA);
    const receiverToken = await registerAndLogin(receiverA);
    const listing = await createListing(providerToken);

    const response = await reserve(
      receiverToken,
      listing.body.data.listing.id,
      5,
    );

    assert.equal(response.status, 403);
    assert.equal(response.body.error.code, 'RECEIVER_NOT_VERIFIED');
  });

  it('menolak provider membuat reservasi', async () => {
    const providerToken = await registerVerified(providerA);
    const listing = await createListing(providerToken);

    const response = await reserve(
      providerToken,
      listing.body.data.listing.id,
      5,
    );

    assert.equal(response.status, 403);
    assert.equal(response.body.error.code, 'FORBIDDEN');
  });

  it('menolak jumlah melebihi stok tanpa mengubah stok', async () => {
    const providerToken = await registerVerified(providerA);
    const receiverToken = await registerVerified(receiverA);
    const listing = await createListing(providerToken);
    const listingId = listing.body.data.listing.id;

    const response = await reserve(receiverToken, listingId, 21);

    assert.equal(response.status, 409);
    assert.equal(response.body.error.code, 'LISTING_NOT_AVAILABLE');
    assert.equal(await Reservation.countDocuments(), 0);

    const stored = await FoodListing.findById(listingId);
    assert.equal(stored.availableQuantity, 20);
  });

  it('menolak listing yang sudah lewat batas pengambilan atau kedaluwarsa', async () => {
    const providerToken = await registerVerified(providerA);
    const receiverToken = await registerVerified(receiverA);
    const listing = await createListing(providerToken);
    const listingId = listing.body.data.listing.id;

    await FoodListing.updateOne(
      { _id: listingId },
      { $set: { pickupDeadline: new Date(Date.now() - HOUR) } },
    );

    const pastDeadline = await reserve(receiverToken, listingId, 1);
    assert.equal(pastDeadline.status, 409);
    assert.equal(pastDeadline.body.error.code, 'LISTING_NOT_AVAILABLE');

    await FoodListing.updateOne(
      { _id: listingId },
      {
        $set: {
          pickupDeadline: new Date(Date.now() + 4 * HOUR),
          expiryDate: new Date(Date.now() - HOUR),
        },
      },
    );

    const expired = await reserve(receiverToken, listingId, 1);
    assert.equal(expired.status, 409);
  });

  it('membatalkan seluruh transaksi jika jadwal pengambilan tidak valid', async () => {
    const providerToken = await registerVerified(providerA);
    const receiverToken = await registerVerified(receiverA);
    const listing = await createListing(providerToken);
    const listingId = listing.body.data.listing.id;

    const response = await reserve(receiverToken, listingId, 5, {
      pickupSchedule: isoFromNow(12 * HOUR),
    });

    assert.equal(response.status, 422);
    assert.equal(response.body.error.code, 'VALIDATION_ERROR');
    assert.equal(await Reservation.countDocuments(), 0);

    const stored = await FoodListing.findById(listingId);
    assert.equal(stored.availableQuantity, 20);
  });

  it('permintaan bersamaan tidak membuat stok negatif', async () => {
    const providerToken = await registerVerified(providerA);
    const receiverToken = await registerVerified(receiverA);
    const listing = await createListing(providerToken, { quantity: 10 });
    const listingId = listing.body.data.listing.id;

    const responses = await Promise.all(
      Array.from({ length: 5 }, () =>
        reserve(receiverToken, listingId, 3),
      ),
    );

    const successes = responses.filter((item) => item.status === 201);
    const conflicts = responses.filter((item) => item.status === 409);

    assert.equal(successes.length, 3);
    assert.equal(conflicts.length, 2);

    const stored = await FoodListing.findById(listingId);
    assert.equal(stored.availableQuantity, 1);
    assert.equal(stored.quantity, 10);
    assert.ok(stored.availableQuantity >= 0);
    assert.equal(await Reservation.countDocuments(), 3);
  });

  it('listing penuh menjadi reserved dan kembali available setelah ditolak', async () => {
    const providerToken = await registerVerified(providerA);
    const receiverToken = await registerVerified(receiverA);
    const listing = await createListing(providerToken, { quantity: 4 });
    const listingId = listing.body.data.listing.id;

    const created = await reserve(receiverToken, listingId, 4);
    assert.equal(created.status, 201);

    const full = await FoodListing.findById(listingId);
    assert.equal(full.availableQuantity, 0);
    assert.equal(full.status, 'reserved');

    const publicList = await request(app)
      .get('/api/foods')
      .set('Authorization', `Bearer ${receiverToken}`);
    assert.equal(
      publicList.body.data.items.some((item) => item.id === listingId),
      false,
    );

    const detailAsReceiver = await request(app)
      .get(`/api/foods/${listingId}`)
      .set('Authorization', `Bearer ${receiverToken}`);
    assert.equal(detailAsReceiver.status, 404);

    const rejected = await reject(
      providerToken,
      created.body.data.reservation.id,
      { reason: 'Stok ternyata tidak cukup' },
    );
    assert.equal(rejected.status, 200);

    const restored = await FoodListing.findById(listingId);
    assert.equal(restored.availableQuantity, 4);
    assert.equal(restored.status, 'available');

    const publicAfter = await request(app)
      .get('/api/foods')
      .set('Authorization', `Bearer ${receiverToken}`);
    assert.equal(
      publicAfter.body.data.items.some((item) => item.id === listingId),
      true,
    );
  });
});

describe('Persetujuan dan penolakan reservasi', () => {
  async function setupReservation(quantity = 5) {
    const providerToken = await registerVerified(providerA);
    const receiverToken = await registerVerified(receiverA);
    const listing = await createListing(providerToken);
    const listingId = listing.body.data.listing.id;
    const created = await reserve(receiverToken, listingId, quantity);

    return {
      providerToken,
      receiverToken,
      listingId,
      reservationId: created.body.data.reservation.id,
    };
  }

  it('hanya provider pemilik yang dapat menyetujui', async () => {
    const { providerToken, receiverToken, reservationId } =
      await setupReservation();
    const otherProviderToken = await registerVerified(providerB);

    const byReceiver = await approve(receiverToken, reservationId);
    assert.equal(byReceiver.status, 403);

    const byOtherProvider = await approve(otherProviderToken, reservationId);
    assert.equal(byOtherProvider.status, 403);

    const response = await approve(providerToken, reservationId, {
      pickupSchedule: isoFromNow(3 * HOUR),
      note: 'Silakan ambil sore',
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.data.reservation.status, 'approved');
    assert.ok(response.body.data.reservation.approvedAt);
    assert.ok(response.body.data.reservation.pickupSchedule);

    const log = await ActivityLog.findOne({
      action: 'reservation.approved',
    });
    assert.ok(log);
  });

  it('menolak persetujuan kedua', async () => {
    const { providerToken, reservationId } = await setupReservation();

    assert.equal((await approve(providerToken, reservationId)).status, 200);

    const second = await approve(providerToken, reservationId);
    assert.equal(second.status, 409);
    assert.equal(second.body.error.code, 'INVALID_STATUS');
  });

  it('menolak reservasi mengembalikan stok tepat satu kali', async () => {
    const { providerToken, listingId, reservationId } =
      await setupReservation(5);

    const withoutReason = await reject(providerToken, reservationId);
    assert.equal(withoutReason.status, 422);

    const response = await reject(providerToken, reservationId, {
      reason: 'Makanan sudah habis',
    });
    assert.equal(response.status, 200);
    assert.equal(response.body.data.reservation.status, 'rejected');
    assert.equal(
      response.body.data.reservation.statusNote,
      'Makanan sudah habis',
    );

    const stored = await FoodListing.findById(listingId);
    assert.equal(stored.availableQuantity, 20);

    const second = await reject(providerToken, reservationId, {
      reason: 'Coba lagi',
    });
    assert.equal(second.status, 409);

    const afterRetry = await FoodListing.findById(listingId);
    assert.equal(afterRetry.availableQuantity, 20);
  });

  it('provider lain tidak dapat menolak reservasi', async () => {
    const { reservationId } = await setupReservation();
    const otherProviderToken = await registerVerified(providerB);

    const response = await reject(otherProviderToken, reservationId, {
      reason: 'Bukan milik saya',
    });

    assert.equal(response.status, 403);
    assert.equal(response.body.error.code, 'FORBIDDEN');
  });
});

describe('Pembatalan reservasi', () => {
  it('receiver dapat membatalkan reservasi pending dan stok kembali', async () => {
    const providerToken = await registerVerified(providerA);
    const receiverToken = await registerVerified(receiverA);
    const otherReceiverToken = await registerVerified(receiverB);
    const listing = await createListing(providerToken);
    const listingId = listing.body.data.listing.id;
    const created = await reserve(receiverToken, listingId, 5);
    const reservationId = created.body.data.reservation.id;

    const byOther = await cancel(otherReceiverToken, reservationId);
    assert.equal(byOther.status, 403);

    const response = await cancel(receiverToken, reservationId, {
      reason: 'Rencana berubah',
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.data.reservation.status, 'cancelled');

    const stored = await FoodListing.findById(listingId);
    assert.equal(stored.availableQuantity, 20);

    const second = await cancel(receiverToken, reservationId);
    assert.equal(second.status, 409);
    assert.equal(second.body.error.code, 'INVALID_STATUS');
  });

  it('provider tidak dapat membatalkan reservasi pending', async () => {
    const providerToken = await registerVerified(providerA);
    const receiverToken = await registerVerified(receiverA);
    const listing = await createListing(providerToken);
    const created = await reserve(
      receiverToken,
      listing.body.data.listing.id,
      5,
    );

    const response = await cancel(
      providerToken,
      created.body.data.reservation.id,
    );

    assert.equal(response.status, 409);
    assert.equal(response.body.error.code, 'INVALID_STATUS');
  });

  it('provider dapat membatalkan reservasi yang sudah disetujui', async () => {
    const providerToken = await registerVerified(providerA);
    const receiverToken = await registerVerified(receiverA);
    const listing = await createListing(providerToken);
    const listingId = listing.body.data.listing.id;
    const created = await reserve(receiverToken, listingId, 5);
    const reservationId = created.body.data.reservation.id;

    await approve(providerToken, reservationId);

    const response = await cancel(providerToken, reservationId, {
      reason: 'Makanan rusak sebelum diambil',
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.data.reservation.status, 'cancelled');

    const stored = await FoodListing.findById(listingId);
    assert.equal(stored.availableQuantity, 20);
  });
});

describe('Riwayat dan detail reservasi', () => {
  it('setiap pihak hanya melihat reservasi yang terkait', async () => {
    const providerToken = await registerVerified(providerA);
    const receiverToken = await registerVerified(receiverA);
    const otherReceiverToken = await registerVerified(receiverB);
    const adminToken = await createAdmin();
    const listing = await createListing(providerToken);
    const created = await reserve(
      receiverToken,
      listing.body.data.listing.id,
      5,
    );
    const reservationId = created.body.data.reservation.id;

    const receiverList = await listMine(receiverToken);
    assert.equal(receiverList.body.data.pagination.total, 1);

    const otherReceiverList = await listMine(otherReceiverToken);
    assert.equal(otherReceiverList.body.data.pagination.total, 0);

    const providerList = await listMine(providerToken);
    assert.equal(providerList.body.data.pagination.total, 1);
    assert.equal(
      providerList.body.data.items[0].receiverId.organizationName,
      receiverA.organizationName,
    );

    const adminList = await listMine(adminToken);
    assert.equal(adminList.body.data.pagination.total, 1);

    assert.equal((await detail(receiverToken, reservationId)).status, 200);
    assert.equal((await detail(providerToken, reservationId)).status, 200);
    assert.equal((await detail(adminToken, reservationId)).status, 200);
    assert.equal(
      (await detail(otherReceiverToken, reservationId)).status,
      403,
    );
  });

  it('memfilter riwayat berdasarkan status', async () => {
    const providerToken = await registerVerified(providerA);
    const receiverToken = await registerVerified(receiverA);
    const listing = await createListing(providerToken);
    const listingId = listing.body.data.listing.id;

    const first = await reserve(receiverToken, listingId, 2);
    await reserve(receiverToken, listingId, 3);
    await reject(providerToken, first.body.data.reservation.id, {
      reason: 'Tidak tersedia',
    });

    const rejected = await listMine(receiverToken, '?status=rejected');
    assert.equal(rejected.body.data.pagination.total, 1);

    const pending = await listMine(receiverToken, '?status=pending');
    assert.equal(pending.body.data.pagination.total, 1);
  });
});

describe('Integrasi dengan listing', () => {
  it('listing dengan reservasi aktif tidak dapat diubah atau ditutup', async () => {
    const providerToken = await registerVerified(providerA);
    const receiverToken = await registerVerified(receiverA);
    const listing = await createListing(providerToken);
    const listingId = listing.body.data.listing.id;
    const created = await reserve(receiverToken, listingId, 5);

    const edit = await request(app)
      .patch(`/api/foods/${listingId}`)
      .set('Authorization', `Bearer ${providerToken}`)
      .send({ name: 'Nama Baru' });
    assert.equal(edit.status, 409);
    assert.equal(edit.body.error.code, 'LISTING_HAS_ACTIVE_RESERVATIONS');

    const close = await request(app)
      .delete(`/api/foods/${listingId}`)
      .set('Authorization', `Bearer ${providerToken}`);
    assert.equal(close.status, 409);
    assert.equal(close.body.error.code, 'LISTING_HAS_ACTIVE_RESERVATIONS');

    await reject(providerToken, created.body.data.reservation.id, {
      reason: 'Dibatalkan untuk uji',
    });

    const editAfter = await request(app)
      .patch(`/api/foods/${listingId}`)
      .set('Authorization', `Bearer ${providerToken}`)
      .send({ name: 'Nama Baru' });
    assert.equal(editAfter.status, 200);

    const closeAfter = await request(app)
      .delete(`/api/foods/${listingId}`)
      .set('Authorization', `Bearer ${providerToken}`);
    assert.equal(closeAfter.status, 200);
  });
});
