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
let Distribution;
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
  ({ Distribution } = await import(
    '../src/modules/distributions/distribution.model.js'
  ));
  ({ ActivityLog } = await import(
    '../src/modules/activity-logs/activity-log.model.js'
  ));

  await User.init();
  await FoodListing.init();
  await Reservation.init();
  await Distribution.init();
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
    Distribution.deleteMany({}),
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

function reserve(token, listingId, quantity) {
  return request(app)
    .post('/api/reservations')
    .set('Authorization', `Bearer ${token}`)
    .send({ listingId, quantity });
}

function approve(token, id, payload = {}) {
  return request(app)
    .patch(`/api/reservations/${id}/approve`)
    .set('Authorization', `Bearer ${token}`)
    .send(payload);
}

function markReady(token, id) {
  return request(app)
    .patch(`/api/reservations/${id}/ready`)
    .set('Authorization', `Bearer ${token}`)
    .send({});
}

function verifyPickup(token, id, code) {
  return request(app)
    .patch(`/api/distributions/${id}/verify-pickup`)
    .set('Authorization', `Bearer ${token}`)
    .send({ code });
}

function complete(token, id) {
  return request(app)
    .patch(`/api/distributions/${id}/complete`)
    .set('Authorization', `Bearer ${token}`)
    .send({});
}

function history(token, query = '') {
  return request(app)
    .get(`/api/distributions/history${query}`)
    .set('Authorization', `Bearer ${token}`);
}

async function createApprovedReservation({
  quantity = 5,
  listingQuantity = quantity,
  withSchedule = true,
  provider = providerA,
  receiver = receiverA,
} = {}) {
  const providerToken = await registerVerified(provider);
  const receiverToken = await registerVerified(receiver);
  const listing = await createListing(providerToken, {
    quantity: listingQuantity,
  });
  const listingId = listing.body.data.listing.id;
  const created = await reserve(receiverToken, listingId, quantity);
  const reservationId = created.body.data.reservation.id;

  const approval = await approve(
    providerToken,
    reservationId,
    withSchedule ? { pickupSchedule: isoFromNow(3 * HOUR) } : {},
  );
  assert.equal(approval.status, 200);

  return {
    providerToken,
    receiverToken,
    listingId,
    reservationId,
    distributionId: undefined,
  };
}

async function createReadyDistribution(options = {}) {
  const context = await createApprovedReservation(options);
  const ready = await markReady(context.providerToken, context.reservationId);

  assert.equal(ready.status, 200);

  return {
    ...context,
    distributionId: ready.body.data.distribution.id,
    pickupCode: ready.body.data.pickupCode,
  };
}

describe('Penandaan siap diambil', () => {
  it('membuat distribusi dan kode pengambilan sekali pakai', async () => {
    const context = await createReadyDistribution();

    const reservation = await Reservation.findById(context.reservationId);
    assert.equal(reservation.status, 'ready_for_pickup');

    const distribution = await Distribution.findById(
      context.distributionId,
    ).select('+pickupVerificationHash');
    assert.equal(distribution.status, 'pickup_ready');
    assert.equal(distribution.quantity, 5);
    assert.match(context.pickupCode, /^\d{6}$/);
    assert.notEqual(distribution.pickupVerificationHash, context.pickupCode);
    assert.match(distribution.pickupVerificationHash, /^\$2[aby]\$/);

    const log = await ActivityLog.findOne({
      action: 'reservation.ready_for_pickup',
    });
    assert.ok(log);
  });

  it('tidak menampilkan hash kode pada respons API', async () => {
    const context = await createApprovedReservation();
    const ready = await markReady(
      context.providerToken,
      context.reservationId,
    );

    assert.equal(ready.status, 200);
    assert.equal(
      ready.body.data.distribution.pickupVerificationHash,
      undefined,
    );
    assert.equal(
      JSON.stringify(ready.body).includes('pickupVerificationHash'),
      false,
    );
  });

  it('menolak penandaan ulang dan aktor yang tidak berhak', async () => {
    const context = await createReadyDistribution();
    const otherProviderToken = await registerVerified(providerB);

    const repeat = await markReady(
      context.providerToken,
      context.reservationId,
    );
    assert.equal(repeat.status, 409);
    assert.equal(repeat.body.error.code, 'INVALID_STATUS');

    const byOtherProvider = await markReady(
      otherProviderToken,
      context.reservationId,
    );
    assert.equal(byOtherProvider.status, 403);

    const byReceiver = await markReady(
      context.receiverToken,
      context.reservationId,
    );
    assert.equal(byReceiver.status, 403);
  });

  it('mensyaratkan status approved dan jadwal pengambilan', async () => {
    const providerToken = await registerVerified(providerA);
    const receiverToken = await registerVerified(receiverA);
    const listing = await createListing(providerToken);
    const created = await reserve(
      receiverToken,
      listing.body.data.listing.id,
      5,
    );
    const reservationId = created.body.data.reservation.id;

    const pending = await markReady(providerToken, reservationId);
    assert.equal(pending.status, 409);
    assert.equal(pending.body.error.code, 'INVALID_STATUS');

    await approve(providerToken, reservationId);

    const noSchedule = await markReady(providerToken, reservationId);
    assert.equal(noSchedule.status, 409);
    assert.equal(noSchedule.body.error.code, 'PICKUP_SCHEDULE_REQUIRED');
  });
});

describe('Verifikasi pengambilan', () => {
  it('provider memverifikasi kode dan reservasi menjadi picked_up', async () => {
    const context = await createReadyDistribution();

    const response = await verifyPickup(
      context.providerToken,
      context.distributionId,
      context.pickupCode,
    );

    assert.equal(response.status, 200);
    assert.equal(response.body.data.distribution.status, 'verified');
    assert.ok(response.body.data.distribution.verifiedAt);

    const reservation = await Reservation.findById(context.reservationId);
    assert.equal(reservation.status, 'picked_up');

    const log = await ActivityLog.findOne({
      action: 'distribution.pickup_verified',
    });
    assert.ok(log);

    const reuse = await verifyPickup(
      context.providerToken,
      context.distributionId,
      context.pickupCode,
    );
    assert.equal(reuse.status, 409);
  });

  it('menolak kode salah tanpa mengubah status', async () => {
    const context = await createReadyDistribution();

    const response = await verifyPickup(
      context.providerToken,
      context.distributionId,
      '000000',
    );

    assert.equal(response.status, 400);
    assert.equal(response.body.error.code, 'INVALID_PICKUP_CODE');

    const distribution = await Distribution.findById(context.distributionId);
    assert.equal(distribution.status, 'pickup_ready');

    const reservation = await Reservation.findById(context.reservationId);
    assert.equal(reservation.status, 'ready_for_pickup');
  });

  it('receiver tidak dapat memverifikasi pengambilan', async () => {
    const context = await createReadyDistribution();

    const response = await verifyPickup(
      context.receiverToken,
      context.distributionId,
      context.pickupCode,
    );

    assert.equal(response.status, 403);
  });
});

describe('Penyelesaian distribusi', () => {
  it('receiver menyelesaikan distribusi dan listing menjadi completed', async () => {
    const context = await createReadyDistribution({ quantity: 5 });

    const verified = await verifyPickup(
      context.providerToken,
      context.distributionId,
      context.pickupCode,
    );
    assert.equal(verified.status, 200);

    const response = await complete(
      context.receiverToken,
      context.distributionId,
    );

    assert.equal(response.status, 200);
    assert.equal(response.body.data.distribution.status, 'completed');
    assert.ok(response.body.data.distribution.completedAt);

    const reservation = await Reservation.findById(context.reservationId);
    assert.equal(reservation.status, 'completed');

    const listing = await FoodListing.findById(context.listingId);
    assert.equal(listing.status, 'completed');
    assert.equal(listing.availableQuantity, 0);

    const log = await ActivityLog.findOne({
      action: 'distribution.completed',
    });
    assert.ok(log);
  });

  it('menolak penyelesaian sebelum verifikasi dan oleh pihak yang salah', async () => {
    const context = await createReadyDistribution();
    const otherReceiverToken = await registerVerified(receiverB);

    const beforeVerify = await complete(
      context.receiverToken,
      context.distributionId,
    );
    assert.equal(beforeVerify.status, 409);
    assert.equal(beforeVerify.body.error.code, 'INVALID_STATUS');

    await verifyPickup(
      context.providerToken,
      context.distributionId,
      context.pickupCode,
    );

    const byProvider = await complete(
      context.providerToken,
      context.distributionId,
    );
    assert.equal(byProvider.status, 403);

    const byOtherReceiver = await complete(
      otherReceiverToken,
      context.distributionId,
    );
    assert.equal(byOtherReceiver.status, 403);

    assert.equal(
      (await complete(context.receiverToken, context.distributionId)).status,
      200,
    );

    const second = await complete(
      context.receiverToken,
      context.distributionId,
    );
    assert.equal(second.status, 409);
  });

  it('listing dengan stok tersisa tetap available setelah distribusi selesai', async () => {
    const context = await createReadyDistribution({
      quantity: 4,
      listingQuantity: 20,
    });

    await verifyPickup(
      context.providerToken,
      context.distributionId,
      context.pickupCode,
    );
    await complete(context.receiverToken, context.distributionId);

    const listing = await FoodListing.findById(context.listingId);
    assert.equal(listing.status, 'available');
    assert.equal(listing.availableQuantity, 16);
  });
});

describe('Riwayat distribusi', () => {
  it('membatasi riwayat sesuai pihak terkait', async () => {
    const first = await createReadyDistribution({ quantity: 3 });
    const second = await createReadyDistribution({
      quantity: 2,
      provider: providerB,
      receiver: receiverB,
    });

    await verifyPickup(
      first.providerToken,
      first.distributionId,
      first.pickupCode,
    );
    await complete(first.receiverToken, first.distributionId);

    const adminToken = await createAdmin();

    const receiverAResult = await history(first.receiverToken);
    assert.equal(receiverAResult.status, 200);
    assert.equal(receiverAResult.body.data.pagination.total, 1);
    assert.equal(
      receiverAResult.body.data.items[0].receiverId.organizationName,
      receiverA.organizationName,
    );

    const receiverBResult = await history(second.receiverToken);
    assert.equal(receiverBResult.body.data.pagination.total, 1);

    const providerAResult = await history(first.providerToken);
    assert.equal(providerAResult.body.data.pagination.total, 1);

    const adminResult = await history(adminToken);
    assert.equal(adminResult.body.data.pagination.total, 2);

    const filtered = await history(first.receiverToken, '?status=completed');
    assert.equal(filtered.body.data.pagination.total, 1);

    const noMatch = await history(first.receiverToken, '?status=pending');
    assert.equal(noMatch.body.data.pagination.total, 0);

    assert.equal(
      JSON.stringify(adminResult.body).includes('pickupVerificationHash'),
      false,
    );
  });

  it('mengembalikan riwayat kosong untuk pihak tanpa distribusi', async () => {
    const token = await registerVerified(receiverA);

    const response = await history(token);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data.items, []);
    assert.equal(response.body.data.pagination.total, 0);
  });
});
