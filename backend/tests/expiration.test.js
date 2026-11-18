import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
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
  email: 'expiration-provider@wasteless.test',
  password: 'password123',
  role: 'provider',
  organizationName: 'Dapur Berkah',
};

const receiver = {
  name: 'Yayasan Peduli',
  email: 'expiration-receiver@wasteless.test',
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
let expireStaleListings;

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
  ({ expireStaleListings } = await import(
    '../src/jobs/expiration.job.js'
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

async function createListing(token, overrides = {}) {
  const response = await request(app)
    .post('/api/foods')
    .set('Authorization', `Bearer ${token}`)
    .send({ ...validListing, ...overrides });
  assert.equal(response.status, 201);
  return response.body.data.listing.id;
}

async function reserve(token, listingId, quantity) {
  const response = await request(app)
    .post('/api/reservations')
    .set('Authorization', `Bearer ${token}`)
    .send({ listingId, quantity });
  assert.equal(response.status, 201);
  return response.body.data.reservation.id;
}

async function makeReady(providerToken, reservationId) {
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

  return ready.body.data.distribution.id;
}

describe('Job kedaluwarsa listing', () => {
  it('mengubah listing lewat batas waktu menjadi expired', async () => {
    const providerToken = await registerVerified(provider);
    const staleId = await createListing(providerToken);
    const futureId = await createListing(providerToken);
    const pastDate = new Date(Date.now() - HOUR);

    await FoodListing.updateOne(
      { _id: staleId },
      { $set: { pickupDeadline: pastDate } },
    );

    const result = await expireStaleListings();

    assert.equal(result.listingsExpired, 1);
    assert.equal((await FoodListing.findById(staleId)).status, 'expired');
    assert.equal((await FoodListing.findById(futureId)).status, 'available');
    assert.ok(await ActivityLog.findOne({ action: 'listing.expired' }));
  });

  it('mengakhiri reservasi aktif, mengembalikan stok, dan menggagalkan distribusi siap ambil', async () => {
    const providerToken = await registerVerified(provider);
    const receiverToken = await registerVerified(receiver);
    const listingId = await createListing(providerToken);
    const reservationId = await reserve(receiverToken, listingId, 4);
    const readyListingId = await createListing(providerToken);
    const readyReservationId = await reserve(
      receiverToken,
      readyListingId,
      5,
    );
    const distributionId = await makeReady(
      providerToken,
      readyReservationId,
    );

    await FoodListing.updateMany(
      { _id: { $in: [listingId, readyListingId] } },
      { $set: { pickupDeadline: new Date(Date.now() - HOUR) } },
    );

    const result = await expireStaleListings();

    assert.equal(result.reservationsExpired, 2);
    assert.equal(result.distributionsFailed, 1);
    assert.equal(result.listingsExpired, 2);

    const reservation = await Reservation.findById(reservationId);
    assert.equal(reservation.status, 'expired');
    assert.equal(reservation.statusChangedBy, null);

    const readyReservation = await Reservation.findById(readyReservationId);
    assert.equal(readyReservation.status, 'expired');
    assert.equal((await Distribution.findById(distributionId)).status, 'failed');

    const listing = await FoodListing.findById(listingId);
    assert.equal(listing.status, 'expired');
    assert.equal(listing.availableQuantity, 10);

    const readyListing = await FoodListing.findById(readyListingId);
    assert.equal(readyListing.status, 'expired');
    assert.equal(readyListing.availableQuantity, 10);

    const logs = await ActivityLog.find({ action: 'reservation.expired' });
    assert.equal(logs.length, 2);
  });

  it('idempotent dan tidak menyentuh listing selesai/dibatalkan', async () => {
    const providerToken = await registerVerified(provider);
    const receiverToken = await registerVerified(receiver);
    const listingId = await createListing(providerToken);
    const reservationId = await reserve(receiverToken, listingId, 4);
    const completedId = await createListing(providerToken);
    const cancelledId = await createListing(providerToken);
    const pastDate = new Date(Date.now() - HOUR);

    await FoodListing.updateOne(
      { _id: listingId },
      { $set: { pickupDeadline: pastDate } },
    );
    await FoodListing.updateOne(
      { _id: completedId },
      { $set: { pickupDeadline: pastDate, status: 'completed' } },
    );
    await FoodListing.updateOne(
      { _id: cancelledId },
      { $set: { pickupDeadline: pastDate, status: 'cancelled' } },
    );

    const first = await expireStaleListings();
    const second = await expireStaleListings();

    assert.equal(first.reservationsExpired, 1);
    assert.equal(first.listingsExpired, 1);
    assert.deepEqual(second, {
      reservationsExpired: 0,
      distributionsFailed: 0,
      listingsExpired: 0,
    });

    assert.equal(
      (await FoodListing.findById(completedId)).status,
      'completed',
    );
    assert.equal(
      (await FoodListing.findById(cancelledId)).status,
      'cancelled',
    );

    const reservation = await Reservation.findById(reservationId);
    assert.equal(reservation.status, 'expired');
    assert.equal(
      (await FoodListing.findById(listingId)).availableQuantity,
      10,
    );
  });

  it('menghormati tanggal kedaluwarsa walau batas pengambilan masih jauh', async () => {
    const providerToken = await registerVerified(provider);
    const listingId = await createListing(providerToken, {
      expiryDate: isoFromNow(4 * HOUR),
    });

    await FoodListing.updateOne(
      { _id: listingId },
      { $set: { expiryDate: new Date(Date.now() - HOUR) } },
    );

    const result = await expireStaleListings();

    assert.equal(result.listingsExpired, 1);
    assert.equal((await FoodListing.findById(listingId)).status, 'expired');
  });
});
