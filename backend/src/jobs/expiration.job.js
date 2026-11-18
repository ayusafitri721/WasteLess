import { runInTransaction } from '../utils/transaction.js';
import { logActivity } from '../modules/activity-logs/activity-log.service.js';
import { FoodListing } from '../modules/foods/food.model.js';
import { Distribution } from '../modules/distributions/distribution.model.js';
import {
  ACTIVE_RESERVATION_STATUSES,
  EXPIRABLE_RESERVATION_STATUSES,
} from '../modules/reservations/reservation.constants.js';
import { Reservation } from '../modules/reservations/reservation.model.js';
import { refundStock } from '../modules/reservations/reservation.service.js';

const BATCH_SIZE = 500;

export async function expireStaleListings(now = new Date()) {
  const staleListings = await FoodListing.find({
    status: { $in: ['available', 'reserved'] },
    $or: [{ pickupDeadline: { $lt: now } }, { expiryDate: { $lt: now } }],
  })
    .select('_id')
    .sort({ pickupDeadline: 1 })
    .limit(BATCH_SIZE)
    .lean();

  const result = {
    reservationsExpired: 0,
    distributionsFailed: 0,
    listingsExpired: 0,
  };

  if (staleListings.length === 0) {
    return result;
  }

  const listingIds = staleListings.map((listing) => listing._id);
  const activeReservations = await Reservation.find({
    listingId: { $in: listingIds },
    status: { $in: EXPIRABLE_RESERVATION_STATUSES },
  })
    .select('_id')
    .lean();

  for (const { _id: reservationId } of activeReservations) {
    const outcome = await runInTransaction(async (session) => {
      const reservation = await Reservation.findOneAndUpdate(
        {
          _id: reservationId,
          status: { $in: EXPIRABLE_RESERVATION_STATUSES },
        },
        { $set: { status: 'expired', statusChangedBy: null } },
        { returnDocument: 'after', session },
      );

      if (!reservation) {
        return null;
      }

      await refundStock(reservation.listingId, reservation.quantity, session);

      const distribution = await Distribution.findOneAndUpdate(
        { reservationId: reservation._id, status: 'pickup_ready' },
        { $set: { status: 'failed' } },
        { returnDocument: 'after', session },
      );

      await logActivity(
        {
          actorId: null,
          action: 'reservation.expired',
          resourceType: 'Reservation',
          resourceId: reservation.id,
          metadata: {
            listingId: reservation.listingId.toString(),
            distributionId: distribution?.id ?? null,
          },
        },
        session,
      );

      return { distributionFailed: Boolean(distribution) };
    });

    if (outcome) {
      result.reservationsExpired += 1;
      if (outcome.distributionFailed) {
        result.distributionsFailed += 1;
      }
    }
  }

  for (const { _id: listingId } of staleListings) {
    const stillReserved = await Reservation.exists({
      listingId,
      status: { $in: ACTIVE_RESERVATION_STATUSES },
    });

    if (stillReserved) {
      continue;
    }

    const expired = await runInTransaction(async (session) => {
      const listing = await FoodListing.findOneAndUpdate(
        {
          _id: listingId,
          status: { $in: ['available', 'reserved'] },
          $or: [{ pickupDeadline: { $lt: now } }, { expiryDate: { $lt: now } }],
        },
        { $set: { status: 'expired' } },
        { returnDocument: 'after', session },
      );

      if (!listing) {
        return null;
      }

      await logActivity(
        {
          actorId: null,
          action: 'listing.expired',
          resourceType: 'FoodListing',
          resourceId: listing.id,
          metadata: { pickupDeadline: listing.pickupDeadline },
        },
        session,
      );

      return listing;
    });

    if (expired) {
      result.listingsExpired += 1;
    }
  }

  return result;
}

export function startExpirationJob({ intervalMs = 60000 } = {}) {
  const run = async () => {
    try {
      const result = await expireStaleListings();

      if (
        result.reservationsExpired > 0 ||
        result.distributionsFailed > 0 ||
        result.listingsExpired > 0
      ) {
        console.log(
          `[expiration] reservasi=${result.reservationsExpired} distribusi_gagal=${result.distributionsFailed} listing=${result.listingsExpired}`,
        );
      }
    } catch (err) {
      console.error('[expiration] gagal menjalankan job:', err.message);
    }
  };

  const timer = setInterval(run, intervalMs);
  timer.unref();
  run();

  return timer;
}
