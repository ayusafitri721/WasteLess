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

const provider = {
  name: 'Dapur Berkah',
  email: 'analytics-provider@wasteless.test',
  password: 'password123',
  role: 'provider',
  organizationName: 'Dapur Berkah',
};

const receiver = {
  name: 'Yayasan Peduli',
  email: 'analytics-receiver@wasteless.test',
  password: 'password123',
  role: 'receiver',
  organizationName: 'Yayasan Peduli',
};

const validListing = {
  name: 'Nasi Box Sisa Acara',
  description: 'Nasi box berlebih dari acara kantor, masih layak konsumsi.',
  category: 'makanan_matang',
  quantity: 10,
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

async function registerVerified(payload) {
  const registerResponse = await request(app)
    .post('/api/auth/register')
    .send(payload);
  assert.equal(registerResponse.status, 201);

  await User.updateOne(
    { email: payload.email },
    { $set: { verificationStatus: 'verified' } },
  );

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({ email: payload.email, password: payload.password });
  assert.equal(loginResponse.status, 200);

  return loginResponse.body.data.token;
}

async function createAdmin() {
  await User.create({
    name: 'Administrator',
    email: 'analytics-admin@wasteless.test',
    passwordHash: await bcrypt.hash('password123', 12),
    role: 'admin',
    verificationStatus: 'verified',
  });

  const response = await request(app)
    .post('/api/auth/login')
    .send({ email: 'analytics-admin@wasteless.test', password: 'password123' });
  assert.equal(response.status, 200);

  return response.body.data.token;
}

async function completeDistribution(providerToken, receiverToken) {
  const listingResponse = await request(app)
    .post('/api/foods')
    .set('Authorization', `Bearer ${providerToken}`)
    .send(validListing);
  assert.equal(listingResponse.status, 201);
  const listingId = listingResponse.body.data.listing.id;

  const reservationResponse = await request(app)
    .post('/api/reservations')
    .set('Authorization', `Bearer ${receiverToken}`)
    .send({ listingId, quantity: 4 });
  assert.equal(reservationResponse.status, 201);
  const reservationId = reservationResponse.body.data.reservation.id;

  const approval = await request(app)
    .patch(`/api/reservations/${reservationId}/approve`)
    .set('Authorization', `Bearer ${providerToken}`)
    .send({ pickupSchedule: isoFromNow(3 * HOUR) });
  assert.equal(approval.status, 200);

  const ready = await request(app)
    .patch(`/api/reservations/${reservationId}/ready`)
    .set('Authorization', `Bearer ${providerToken}`)
    .send({});
  assert.equal(ready.status, 200);
  const distributionId = ready.body.data.distribution.id;

  const verified = await request(app)
    .patch(`/api/distributions/${distributionId}/verify-pickup`)
    .set('Authorization', `Bearer ${providerToken}`)
    .send({ code: ready.body.data.pickupCode });
  assert.equal(verified.status, 200);

  const completed = await request(app)
    .patch(`/api/distributions/${distributionId}/complete`)
    .set('Authorization', `Bearer ${receiverToken}`)
    .send({});
  assert.equal(completed.status, 200);

  const rejectedReservation = await request(app)
    .post('/api/reservations')
    .set('Authorization', `Bearer ${receiverToken}`)
    .send({ listingId, quantity: 2 });
  assert.equal(rejectedReservation.status, 201);

  const rejected = await request(app)
    .patch(
      `/api/reservations/${rejectedReservation.body.data.reservation.id}/reject`,
    )
    .set('Authorization', `Bearer ${providerToken}`)
    .send({ reason: 'Stok sudah dialokasikan untuk penerima lain' });
  assert.equal(rejected.status, 200);

  return { listingId, distributionId };
}

describe('Analitik dampak', () => {
  it('menghitung analitik penyedia dari transaksi nyata', async () => {
    const providerToken = await registerVerified(provider);
    const receiverToken = await registerVerified(receiver);
    const { distributionId } = await completeDistribution(
      providerToken,
      receiverToken,
    );

    const distribution = await Distribution.findById(distributionId);
    assert.equal(distribution.unit, 'porsi');

    const response = await request(app)
      .get('/api/analytics/provider')
      .set('Authorization', `Bearer ${providerToken}`);

    assert.equal(response.status, 200);
    const { data } = response.body;
    assert.equal(data.listings.total, 1);
    assert.equal(data.listings.byStatus.available, 1);
    assert.equal(data.reservations.total, 2);
    assert.equal(data.reservations.byStatus.completed, 1);
    assert.equal(data.reservations.byStatus.rejected, 1);
    assert.equal(data.distributions.total, 1);
    assert.equal(data.distributions.byStatus.completed, 1);
    assert.deepEqual(data.completedQuantityByUnit, [
      { unit: 'porsi', quantity: 4, distributions: 1 },
    ]);
  });

  it('menghitung analitik penerima dari transaksi nyata', async () => {
    const providerToken = await registerVerified(provider);
    const receiverToken = await registerVerified(receiver);
    await completeDistribution(providerToken, receiverToken);

    const response = await request(app)
      .get('/api/analytics/receiver')
      .set('Authorization', `Bearer ${receiverToken}`);

    assert.equal(response.status, 200);
    const { data } = response.body;
    assert.equal(data.reservations.total, 2);
    assert.equal(data.reservations.byStatus.completed, 1);
    assert.equal(data.reservations.byStatus.rejected, 1);
    assert.equal(data.distributions.total, 1);
    assert.equal(data.distributions.byStatus.completed, 1);
    assert.deepEqual(data.completedQuantityByUnit, [
      { unit: 'porsi', quantity: 4, distributions: 1 },
    ]);
  });

  it('menghitung analitik platform dan membatasi akses per peran', async () => {
    const providerToken = await registerVerified(provider);
    const receiverToken = await registerVerified(receiver);
    const adminToken = await createAdmin();
    await completeDistribution(providerToken, receiverToken);

    const platform = await request(app)
      .get('/api/analytics/platform')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(platform.status, 200);
    const { data } = platform.body;
    assert.equal(data.users.total, 3);
    assert.equal(data.users.verified, 3);
    assert.equal(data.users.byRole.provider, 1);
    assert.equal(data.users.byRole.receiver, 1);
    assert.equal(data.users.byRole.admin, 1);
    assert.equal(data.listings.total, 1);
    assert.equal(data.reservations.total, 2);
    assert.equal(data.distributions.total, 1);
    assert.deepEqual(data.completedQuantityByUnit, [
      { unit: 'porsi', quantity: 4, distributions: 1 },
    ]);

    const receiverOnProvider = await request(app)
      .get('/api/analytics/provider')
      .set('Authorization', `Bearer ${receiverToken}`);
    assert.equal(receiverOnProvider.status, 403);

    const providerOnReceiver = await request(app)
      .get('/api/analytics/receiver')
      .set('Authorization', `Bearer ${providerToken}`);
    assert.equal(providerOnReceiver.status, 403);

    const providerOnPlatform = await request(app)
      .get('/api/analytics/platform')
      .set('Authorization', `Bearer ${providerToken}`);
    assert.equal(providerOnPlatform.status, 403);
  });
});
