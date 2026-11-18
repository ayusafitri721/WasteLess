import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import {
  completeDistribution,
  markPickupReady,
  verifyPickup,
} from '../src/modules/distributions/distribution.service.js';
import { FoodListing } from '../src/modules/foods/food.model.js';
import { createFoodListing } from '../src/modules/foods/food.service.js';
import {
  approveReservation,
  createReservation,
} from '../src/modules/reservations/reservation.service.js';
import { Reservation } from '../src/modules/reservations/reservation.model.js';
import { User } from '../src/modules/users/user.model.js';

const email = process.env.PROVIDER_EMAIL?.trim().toLowerCase();
const receiverEmail = process.env.RECEIVER_EMAIL?.trim().toLowerCase();
const shouldVerify = process.env.SEED_VERIFY === '1';
const shouldSeedWorkflow = process.env.SEED_WORKFLOW === '1';

if (!email) {
  console.error('PROVIDER_EMAIL wajib diisi.');
  console.error(
    'Contoh: PROVIDER_EMAIL=ayu@gmail.com SEED_VERIFY=1 npm run seed-demo',
  );
  process.exit(1);
}

function future(hours) {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

function past(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

const demoReservations = [
  {
    listingName: 'Roti Gandum dan Croissant',
    status: 'pending',
    quantity: 2,
    scheduleHours: 3,
  },
  {
    listingName: 'Paket Buah dan Sayur Segar',
    status: 'approved',
    quantity: 1,
    scheduleHours: 5,
  },
  {
    listingName: 'Teh Botol dan Air Mineral',
    status: 'ready_for_pickup',
    quantity: 2,
    scheduleHours: 24,
  },
  {
    listingName: 'Biskuit dan Snack Kemasan',
    status: 'completed',
    quantity: 1,
    scheduleHours: 36,
  },
];

const listings = [
  {
    name: 'Nasi Kotak Ayam Bakar',
    description:
      'Data contoh untuk demo. Nasi putih, ayam bakar, tumis sayur, dan sambal dalam kotak makan.',
    category: 'makanan_matang',
    quantity: 12,
    unit: 'porsi',
    productionDate: past(2),
    expiryDate: future(5),
    pickupDeadline: future(4),
    allergens: ['kedelai', 'kacang'],
    storageInstructions: 'Simpan di wadah tertutup, hangatkan sebelum disantap.',
    pickupAddress: 'Jl. Cikutra No. 42, Bandung',
    location: { type: 'Point', coordinates: [107.6405, -6.905] },
  },
  {
    name: 'Roti Gandum dan Croissant',
    description:
      'Data contoh untuk demo. Roti gandum dan croissant dari produksi pagi ini, dikemas kertas food grade.',
    category: 'roti_dan_kue',
    quantity: 8,
    unit: 'paket',
    productionDate: past(3),
    expiryDate: future(48),
    pickupDeadline: future(8),
    allergens: ['gluten', 'susu', 'telur'],
    storageInstructions: 'Simpan pada suhu ruang di dalam kantong kertas.',
    pickupAddress: 'Jl. Cikutra No. 42, Bandung',
    location: { type: 'Point', coordinates: [107.6405, -6.905] },
  },
  {
    name: 'Paket Buah dan Sayur Segar',
    description:
      'Data contoh untuk demo. Paket berisi wortel, bayam, tomat, dan pisang dari pasar pagi.',
    category: 'buah_dan_sayur',
    quantity: 6,
    unit: 'kg',
    productionDate: past(5),
    expiryDate: future(72),
    pickupDeadline: future(12),
    allergens: [],
    storageInstructions: 'Simpan di tempat sejuk dan kering.',
    pickupAddress: 'Jl. Cikutra No. 42, Bandung',
    location: { type: 'Point', coordinates: [107.6405, -6.905] },
  },
  {
    name: 'Teh Botol dan Air Mineral',
    description:
      'Data contoh untuk demo. Minuman kemasan belum dibuka, cocok untuk acara komunitas.',
    category: 'minuman',
    quantity: 18,
    unit: 'item',
    productionDate: past(1),
    expiryDate: future(720),
    pickupDeadline: future(48),
    allergens: [],
    storageInstructions: 'Simpan di tempat sejuk, jauh dari sinar matahari langsung.',
    pickupAddress: 'Jl. Cikutra No. 42, Bandung',
    location: { type: 'Point', coordinates: [107.6405, -6.905] },
  },
  {
    name: 'Biskuit dan Snack Kemasan',
    description:
      'Data contoh untuk demo. Biskuit dan snack kemasan dengan tanggal kedaluwarsa masih panjang.',
    category: 'makanan_kemasan',
    quantity: 20,
    unit: 'paket',
    productionDate: past(24),
    expiryDate: future(1440),
    pickupDeadline: future(72),
    allergens: ['gluten', 'susu'],
    storageInstructions: 'Simpan di wadah tertutup pada suhu ruang.',
    pickupAddress: 'Jl. Cikutra No. 42, Bandung',
    location: { type: 'Point', coordinates: [107.6405, -6.905] },
  },
];

async function seedReservation(provider, receiver, scenario) {
  const listing = await FoodListing.findOne({
    providerId: provider.id,
    name: scenario.listingName,
  });

  if (!listing) {
    console.error(`Listing ${scenario.listingName} tidak ditemukan.`);
    return { skipped: true, pickupCode: null };
  }

  const existing = await Reservation.findOne({
    listingId: listing.id,
    receiverId: receiver.id,
  }).sort({ createdAt: -1 });

  if (existing) {
    console.log(
      `Dilewati: ${scenario.listingName} sudah punya reservasi ${existing.status}.`,
    );
    return { skipped: true, pickupCode: null };
  }

  const pickupSchedule = future(scenario.scheduleHours);
  let reservation = await createReservation(receiver, {
    listingId: listing.id,
    quantity: scenario.quantity,
    pickupSchedule,
  });

  if (scenario.status === 'pending') {
    console.log(`Dibuat: reservasi pending untuk ${scenario.listingName}.`);
    return { skipped: false, pickupCode: null };
  }

  reservation = await approveReservation(provider, reservation.id, {
    pickupSchedule,
    note: 'Contoh alur demo',
  });

  if (scenario.status === 'approved') {
    console.log(`Dibuat: reservasi approved untuk ${scenario.listingName}.`);
    return { skipped: false, pickupCode: null };
  }

  const ready = await markPickupReady(provider, reservation.id);

  if (scenario.status === 'ready_for_pickup') {
    console.log(`Dibuat: reservasi siap diambil untuk ${scenario.listingName}.`);
    return { skipped: false, pickupCode: ready.pickupCode };
  }

  await verifyPickup(provider, ready.distribution.id, ready.pickupCode);
  await completeDistribution(receiver, ready.distribution.id);
  console.log(`Dibuat: distribusi selesai untuk ${scenario.listingName}.`);
  return { skipped: false, pickupCode: null };
}

try {
  await connectDatabase();

  const provider = await User.findOne({ email });

  if (!provider) {
    console.error(`Akun ${email} tidak ditemukan.`);
    process.exitCode = 1;
  } else if (provider.role !== 'provider') {
    console.error(`Akun ${email} bukan penyedia.`);
    process.exitCode = 1;
  } else {
    if (provider.verificationStatus !== 'verified') {
      if (!shouldVerify) {
        console.error(
          `Akun ${email} belum terverifikasi. Jalankan dengan SEED_VERIFY=1 untuk demo.`,
        );
        process.exitCode = 1;
      } else {
        provider.verificationStatus = 'verified';
        provider.organizationName =
          provider.organizationName ??
          process.env.SEED_ORG?.trim() ??
          'Dapur Demo';
        provider.phone = provider.phone ?? process.env.SEED_PHONE?.trim();
        await provider.save();
        console.log(`Akun ${email} ditandai terverifikasi untuk demo.`);
      }
    }

    let created = 0;
    let skipped = 0;

    for (const listing of listings) {
      const exists = await FoodListing.exists({
        providerId: provider.id,
        name: listing.name,
      });

      if (exists) {
        skipped += 1;
        continue;
      }

      await createFoodListing(provider, listing);
      created += 1;
      console.log(`Dibuat: ${listing.name}`);
    }

    console.log(`Selesai. ${created} listing dibuat, ${skipped} dilewati.`);

    if (shouldSeedWorkflow) {
      if (!receiverEmail) {
        console.error('RECEIVER_EMAIL wajib diisi untuk membuat contoh alur.');
        process.exitCode = 1;
      } else {
        const receiver = await User.findOne({ email: receiverEmail });

        if (!receiver) {
          console.error(`Akun ${receiverEmail} tidak ditemukan.`);
          process.exitCode = 1;
        } else if (receiver.role !== 'receiver') {
          console.error(`Akun ${receiverEmail} bukan penerima.`);
          process.exitCode = 1;
        } else {
          if (receiver.verificationStatus !== 'verified') {
            if (!shouldVerify) {
              console.error(
                `Akun ${receiverEmail} belum terverifikasi. Jalankan dengan SEED_VERIFY=1 untuk demo.`,
              );
              process.exitCode = 1;
            } else {
              receiver.verificationStatus = 'verified';
              receiver.organizationName =
                receiver.organizationName ??
                process.env.SEED_RECEIVER_ORG?.trim() ??
                'Komunitas Demo';
              receiver.phone =
                receiver.phone ?? process.env.SEED_RECEIVER_PHONE?.trim();
              await receiver.save();
              console.log(
                `Akun ${receiverEmail} ditandai terverifikasi untuk demo.`,
              );
            }
          }

          const pickupCodes = [];

          for (const scenario of demoReservations) {
            const result = await seedReservation(
              provider,
              receiver,
              scenario,
            );

            if (result.pickupCode) {
              pickupCodes.push(
                `${scenario.listingName}: ${result.pickupCode}`,
              );
            }
          }

          console.log(`Akun penerima demo: ${receiverEmail}`);

          for (const code of pickupCodes) {
            console.log(`Kode pickup demo: ${code}`);
          }
        }
      }
    }
  }
} catch (err) {
  console.error('Gagal membuat data demo:', err.message);
  process.exitCode = 1;
} finally {
  await disconnectDatabase();
}
