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

const receiver = {
  name: 'Yayasan Peduli',
  email: 'receiver@wasteless.test',
  password: 'password123',
  role: 'receiver',
  organizationName: 'Yayasan Peduli',
};

const validListing = {
  name: 'Nasi Box Sisa Acara',
  description: 'Nasi box berlebih dari acara kantor, masih layak konsumsi.',
  category: 'makanan_matang',
  quantity: 20,
  unit: 'porsi',
  productionDate: isoFromNow(-2 * HOUR),
  pickupDeadline: isoFromNow(6 * HOUR),
  allergens: ['kacang'],
  storageInstructions: 'Simpan di suhu ruang',
  pickupAddress: 'Jl. Contoh No. 1, Bandung',
  location: { type: 'Point', coordinates: [107.6, -6.9] },
};

let mongoServer;
let app;
let User;
let FoodListing;
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
  ({ ActivityLog } = await import(
    '../src/modules/activity-logs/activity-log.model.js'
  ));

  await User.init();
  await FoodListing.init();
});

after(async () => {
  await disconnectDatabase();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    FoodListing.deleteMany({}),
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

async function createVerifiedProvider(payload = providerA) {
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

function listFoods(token, query = '') {
  return request(app)
    .get(`/api/foods${query}`)
    .set('Authorization', `Bearer ${token}`);
}

function listMine(token, query = '') {
  return request(app)
    .get(`/api/foods/mine${query}`)
    .set('Authorization', `Bearer ${token}`);
}

function getFood(token, id) {
  return request(app)
    .get(`/api/foods/${id}`)
    .set('Authorization', `Bearer ${token}`);
}

function updateFood(token, id, payload) {
  return request(app)
    .patch(`/api/foods/${id}`)
    .set('Authorization', `Bearer ${token}`)
    .send(payload);
}

function cancelFood(token, id) {
  return request(app)
    .delete(`/api/foods/${id}`)
    .set('Authorization', `Bearer ${token}`);
}

describe('Pembuatan listing', () => {
  it('provider terverifikasi dapat membuat listing', async () => {
    const token = await createVerifiedProvider();

    const response = await createListing(token);

    assert.equal(response.status, 201);
    assert.equal(response.body.data.listing.status, 'available');
    assert.equal(response.body.data.listing.quantity, 20);
    assert.equal(response.body.data.listing.availableQuantity, 20);
    assert.equal(response.body.data.listing.name, validListing.name);

    const stored = await FoodListing.findById(response.body.data.listing.id);
    assert.ok(stored);
    assert.equal(stored.providerId.toString(), response.body.data.listing.providerId);

    const log = await ActivityLog.findOne({
      action: 'food_listing.created',
    });
    assert.ok(log);
  });

  it('menolak provider yang belum terverifikasi', async () => {
    const token = await registerAndLogin(providerA);

    const response = await createListing(token);

    assert.equal(response.status, 403);
    assert.equal(response.body.error.code, 'PROVIDER_NOT_VERIFIED');
  });

  it('menolak receiver membuat listing', async () => {
    const token = await registerAndLogin(receiver);

    const response = await createListing(token);

    assert.equal(response.status, 403);
    assert.equal(response.body.error.code, 'FORBIDDEN');
  });

  it('memvalidasi data listing', async () => {
    const token = await createVerifiedProvider();

    const pastDeadline = await createListing(token, {
      pickupDeadline: isoFromNow(-HOUR),
    });
    assert.equal(pastDeadline.status, 422);

    const zeroQuantity = await createListing(token, { quantity: 0 });
    assert.equal(zeroQuantity.status, 422);

    const unknownCategory = await createListing(token, {
      category: 'kategori_palsu',
    });
    assert.equal(unknownCategory.status, 422);

    const { pickupAddress, ...withoutAddress } = validListing;
    const missingAddress = await request(app)
      .post('/api/foods')
      .set('Authorization', `Bearer ${token}`)
      .send(withoutAddress);
    assert.equal(missingAddress.status, 422);

    const injectedStock = await createListing(token, {
      availableQuantity: 999,
    });
    assert.equal(injectedStock.status, 422);

    assert.equal(await FoodListing.countDocuments(), 0);
  });
});

describe('Pencarian listing', () => {
  it('hanya menampilkan listing tersedia yang belum melewati batas waktu', async () => {
    const token = await createVerifiedProvider();
    await createListing(token, {
      name: 'Nasi Box Segera',
      pickupDeadline: isoFromNow(2 * HOUR),
    });
    await createListing(token, {
      name: 'Roti Malam',
      description: 'Roti manis berlebih dari toko, masih layak dikonsumsi.',
      category: 'roti_dan_kue',
      pickupDeadline: isoFromNow(10 * HOUR),
    });
    const cancelled = await createListing(token, { name: 'Listing Dibatalkan' });
    await cancelFood(token, cancelled.body.data.listing.id);

    const expired = await createListing(token, { name: 'Listing Kedaluwarsa' });
    await FoodListing.updateOne(
      { _id: expired.body.data.listing.id },
      { $set: { pickupDeadline: new Date(Date.now() - HOUR) } },
    );

    const response = await listFoods(token);

    assert.equal(response.status, 200);
    assert.equal(response.body.data.pagination.total, 2);
    assert.equal(response.body.data.items[0].name, 'Nasi Box Segera');
    assert.equal(response.body.data.items[1].name, 'Roti Malam');

    const filtered = await listFoods(token, '?category=roti_dan_kue');
    assert.equal(filtered.body.data.pagination.total, 1);
    assert.equal(filtered.body.data.items[0].name, 'Roti Malam');

    const searched = await listFoods(token, '?q=nasi');
    assert.equal(searched.body.data.pagination.total, 1);
    assert.equal(searched.body.data.items[0].name, 'Nasi Box Segera');

    const paged = await listFoods(token, '?limit=1&page=2');
    assert.equal(paged.body.data.items.length, 1);
    assert.equal(paged.body.data.items[0].name, 'Roti Malam');
  });

  it('riwayat listing milik provider hanya berisi listing sendiri', async () => {
    const tokenA = await createVerifiedProvider(providerA);
    const tokenB = await createVerifiedProvider(providerB);

    await createListing(tokenA, { name: 'Milik A' });
    await createListing(tokenA, { name: 'Milik A Dibatalkan' });
    const toCancel = await createListing(tokenA, { name: 'Akan Dibatalkan' });
    await cancelFood(tokenA, toCancel.body.data.listing.id);
    await createListing(tokenB, { name: 'Milik B' });

    const all = await listMine(tokenA);
    assert.equal(all.status, 200);
    assert.equal(all.body.data.pagination.total, 3);

    const cancelled = await listMine(tokenA, '?status=cancelled');
    assert.equal(cancelled.body.data.pagination.total, 1);
    assert.equal(cancelled.body.data.items[0].name, 'Akan Dibatalkan');

    const other = await listMine(tokenB);
    assert.equal(other.body.data.pagination.total, 1);
    assert.equal(other.body.data.items[0].name, 'Milik B');
  });
});

describe('Detail listing', () => {
  it('receiver dapat melihat listing tersedia', async () => {
    const providerToken = await createVerifiedProvider();
    const receiverToken = await registerAndLogin(receiver);
    const created = await createListing(providerToken);

    const response = await getFood(
      receiverToken,
      created.body.data.listing.id,
    );

    assert.equal(response.status, 200);
    assert.equal(response.body.data.listing.name, validListing.name);
    assert.equal(
      response.body.data.listing.providerId.name,
      providerA.name,
    );
  });

  it('listing tidak tersedia hanya dapat dilihat pemilik dan admin', async () => {
    const providerToken = await createVerifiedProvider();
    const receiverToken = await registerAndLogin(receiver);
    const adminToken = await createAdmin();
    const created = await createListing(providerToken);
    await cancelFood(providerToken, created.body.data.listing.id);

    const byReceiver = await getFood(
      receiverToken,
      created.body.data.listing.id,
    );
    assert.equal(byReceiver.status, 404);
    assert.equal(byReceiver.body.error.code, 'FOOD_NOT_FOUND');

    const byOwner = await getFood(
      providerToken,
      created.body.data.listing.id,
    );
    assert.equal(byOwner.status, 200);
    assert.equal(byOwner.body.data.listing.status, 'cancelled');

    const byAdmin = await getFood(adminToken, created.body.data.listing.id);
    assert.equal(byAdmin.status, 200);
  });

  it('listing yang sudah lewat batas waktu tidak terlihat receiver', async () => {
    const providerToken = await createVerifiedProvider();
    const receiverToken = await registerAndLogin(receiver);
    const created = await createListing(providerToken);
    await FoodListing.updateOne(
      { _id: created.body.data.listing.id },
      { $set: { pickupDeadline: new Date(Date.now() - HOUR) } },
    );

    const response = await getFood(
      receiverToken,
      created.body.data.listing.id,
    );

    assert.equal(response.status, 404);
  });
});

describe('Perubahan dan penutupan listing', () => {
  it('pemilik dapat memperbarui field listing', async () => {
    const token = await createVerifiedProvider();
    const created = await createListing(token);
    const id = created.body.data.listing.id;

    const response = await updateFood(token, id, {
      name: 'Nasi Box Diperbarui',
      pickupDeadline: isoFromNow(12 * HOUR),
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.data.listing.name, 'Nasi Box Diperbarui');

    const stored = await FoodListing.findById(id);
    assert.equal(stored.name, 'Nasi Box Diperbarui');

    const log = await ActivityLog.findOne({
      action: 'food_listing.updated',
    });
    assert.ok(log);
  });

  it('menolak perubahan jumlah stok dan field terlarang', async () => {
    const token = await createVerifiedProvider();
    const created = await createListing(token);
    const id = created.body.data.listing.id;

    const quantity = await updateFood(token, id, { quantity: 999 });
    assert.equal(quantity.status, 422);

    const availableQuantity = await updateFood(token, id, {
      availableQuantity: 999,
    });
    assert.equal(availableQuantity.status, 422);

    const status = await updateFood(token, id, { status: 'completed' });
    assert.equal(status.status, 422);
  });

  it('menolak perubahan oleh provider lain', async () => {
    const tokenA = await createVerifiedProvider(providerA);
    const tokenB = await createVerifiedProvider(providerB);
    const created = await createListing(tokenA);

    const response = await updateFood(
      tokenB,
      created.body.data.listing.id,
      { name: 'Diambil Alih' },
    );

    assert.equal(response.status, 403);
    assert.equal(response.body.error.code, 'FORBIDDEN');
  });

  it('menutup listing dan menolak penutupan berulang', async () => {
    const token = await createVerifiedProvider();
    const created = await createListing(token);
    const id = created.body.data.listing.id;

    const first = await cancelFood(token, id);
    assert.equal(first.status, 200);
    assert.equal(first.body.data.listing.status, 'cancelled');

    const second = await cancelFood(token, id);
    assert.equal(second.status, 409);
    assert.equal(second.body.error.code, 'LISTING_NOT_CANCELLABLE');

    const edit = await updateFood(token, id, { name: 'Tidak Boleh' });
    assert.equal(edit.status, 409);
    assert.equal(edit.body.error.code, 'LISTING_NOT_EDITABLE');

    const log = await ActivityLog.findOne({
      action: 'food_listing.cancelled',
    });
    assert.ok(log);
  });
});
