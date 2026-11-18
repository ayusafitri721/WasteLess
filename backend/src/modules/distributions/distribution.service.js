import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { ApiError } from '../../utils/ApiError.js';
import { runInTransaction } from '../../utils/transaction.js';
import { logActivity } from '../activity-logs/activity-log.service.js';
import { FoodListing } from '../foods/food.model.js';
import { ACTIVE_RESERVATION_STATUSES } from '../reservations/reservation.constants.js';
import { Reservation } from '../reservations/reservation.model.js';
import { Distribution } from './distribution.model.js';

const PICKUP_CODE_ROUNDS = 10;

const HISTORY_LISTING_FIELDS =
  'name category unit pickupAddress pickupDeadline status';
const HISTORY_PARTY_FIELDS = 'name organizationName phone';
const HISTORY_RESERVATION_FIELDS = 'status quantity pickupSchedule approvedAt';

function buildPagination(page, limit, total) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

function notFoundError() {
  return new ApiError(
    404,
    'DISTRIBUTION_NOT_FOUND',
    'Distribusi tidak ditemukan',
  );
}

export async function markPickupReady(user, reservationId) {
  const pickupCode = String(crypto.randomInt(100000, 1000000));
  const pickupVerificationHash = await bcrypt.hash(
    pickupCode,
    PICKUP_CODE_ROUNDS,
  );

  return runInTransaction(async (session) => {
    const existing = await Reservation.findById(reservationId).session(session);

    if (!existing) {
      throw new ApiError(
        404,
        'RESERVATION_NOT_FOUND',
        'Reservasi tidak ditemukan',
      );
    }

    if (!existing.providerId.equals(user.id)) {
      throw new ApiError(
        403,
        'FORBIDDEN',
        'Hanya penyedia pemilik listing yang dapat menandai siap diambil',
      );
    }

    if (existing.status !== 'approved') {
      throw new ApiError(
        409,
        'INVALID_STATUS',
        'Reservasi harus berstatus approved sebelum siap diambil',
      );
    }

    if (!existing.pickupSchedule) {
      throw new ApiError(
        409,
        'PICKUP_SCHEDULE_REQUIRED',
        'Jadwal pengambilan harus ditentukan sebelum menandai siap diambil',
      );
    }

    const reservation = await Reservation.findOneAndUpdate(
      { _id: reservationId, providerId: user.id, status: 'approved' },
      {
        $set: {
          status: 'ready_for_pickup',
          statusChangedBy: user.id,
        },
      },
      { returnDocument: 'after', session },
    );

    if (!reservation) {
      throw new ApiError(
        409,
        'INVALID_STATUS',
        'Status reservasi berubah, silakan muat ulang data',
      );
    }

    const listing = await FoodListing.findById(reservation.listingId).session(
      session,
    );

    if (!listing) {
      throw new ApiError(
        409,
        'LISTING_NOT_FOUND',
        'Listing terkait reservasi tidak ditemukan',
      );
    }

    let distribution;

    try {
      [distribution] = await Distribution.create(
        [
          {
            reservationId: reservation.id,
            listingId: reservation.listingId,
            providerId: reservation.providerId,
            receiverId: reservation.receiverId,
            quantity: reservation.quantity,
            unit: listing.unit,
            pickupVerificationHash,
            status: 'pickup_ready',
          },
        ],
        { session },
      );
    } catch (err) {
      if (err?.code === 11000) {
        throw new ApiError(
          409,
          'DISTRIBUTION_EXISTS',
          'Distribusi untuk reservasi ini sudah ada',
        );
      }
      throw err;
    }

    await logActivity(
      {
        actorId: user.id,
        action: 'reservation.ready_for_pickup',
        resourceType: 'Reservation',
        resourceId: reservation.id,
        metadata: {
          listingId: reservation.listingId.toString(),
          distributionId: distribution.id.toString(),
        },
      },
      session,
    );

    return { reservation, distribution, pickupCode };
  });
}

export async function verifyPickup(user, distributionId, code) {
  return runInTransaction(async (session) => {
    const existing = await Distribution.findById(distributionId)
      .select('+pickupVerificationHash')
      .session(session);

    if (!existing) {
      throw notFoundError();
    }

    if (!existing.providerId.equals(user.id)) {
      throw new ApiError(
        403,
        'FORBIDDEN',
        'Hanya penyedia terkait yang dapat memverifikasi pengambilan',
      );
    }

    if (existing.status !== 'pickup_ready') {
      throw new ApiError(
        409,
        'INVALID_STATUS',
        'Pengambilan hanya dapat diverifikasi saat status pickup_ready',
      );
    }

    const codeMatches = await bcrypt.compare(
      code,
      existing.pickupVerificationHash,
    );

    if (!codeMatches) {
      throw new ApiError(
        400,
        'INVALID_PICKUP_CODE',
        'Kode pengambilan tidak valid',
      );
    }

    const distribution = await Distribution.findOneAndUpdate(
      { _id: distributionId, providerId: user.id, status: 'pickup_ready' },
      { $set: { status: 'verified', verifiedAt: new Date() } },
      { returnDocument: 'after', session },
    );

    if (!distribution) {
      throw new ApiError(
        409,
        'INVALID_STATUS',
        'Status distribusi berubah, silakan muat ulang data',
      );
    }

    const reservation = await Reservation.findOneAndUpdate(
      { _id: distribution.reservationId, status: 'ready_for_pickup' },
      {
        $set: {
          status: 'picked_up',
          statusChangedBy: user.id,
        },
      },
      { returnDocument: 'after', session },
    );

    if (!reservation) {
      throw new ApiError(
        409,
        'RESERVATION_STATUS_MISMATCH',
        'Status reservasi tidak sesuai dengan distribusi',
      );
    }

    await logActivity(
      {
        actorId: user.id,
        action: 'distribution.pickup_verified',
        resourceType: 'Distribution',
        resourceId: distribution.id,
        metadata: {
          reservationId: distribution.reservationId.toString(),
        },
      },
      session,
    );

    return distribution;
  });
}

export async function completeDistribution(user, distributionId) {
  return runInTransaction(async (session) => {
    const existing = await Distribution.findById(distributionId).session(
      session,
    );

    if (!existing) {
      throw notFoundError();
    }

    if (!existing.receiverId.equals(user.id)) {
      throw new ApiError(
        403,
        'FORBIDDEN',
        'Hanya penerima terkait yang dapat mengonfirmasi penyelesaian',
      );
    }

    if (existing.status !== 'verified') {
      throw new ApiError(
        409,
        'INVALID_STATUS',
        'Distribusi hanya dapat diselesaikan setelah pengambilan diverifikasi',
      );
    }

    const distribution = await Distribution.findOneAndUpdate(
      { _id: distributionId, receiverId: user.id, status: 'verified' },
      { $set: { status: 'completed', completedAt: new Date() } },
      { returnDocument: 'after', session },
    );

    if (!distribution) {
      throw new ApiError(
        409,
        'INVALID_STATUS',
        'Status distribusi berubah, silakan muat ulang data',
      );
    }

    const reservation = await Reservation.findOneAndUpdate(
      { _id: distribution.reservationId, status: 'picked_up' },
      {
        $set: {
          status: 'completed',
          statusChangedBy: user.id,
        },
      },
      { returnDocument: 'after', session },
    );

    if (!reservation) {
      throw new ApiError(
        409,
        'RESERVATION_STATUS_MISMATCH',
        'Status reservasi tidak sesuai dengan distribusi',
      );
    }

    const listing = await FoodListing.findById(distribution.listingId).session(
      session,
    );

    if (listing && listing.availableQuantity === 0) {
      const otherActive = await Reservation.exists({
        listingId: distribution.listingId,
        status: { $in: ACTIVE_RESERVATION_STATUSES },
        _id: { $ne: distribution.reservationId },
      }).session(session);

      if (!otherActive) {
        await FoodListing.updateOne(
          { _id: listing.id, status: 'reserved' },
          { $set: { status: 'completed' } },
          { session },
        );
      }
    }

    await logActivity(
      {
        actorId: user.id,
        action: 'distribution.completed',
        resourceType: 'Distribution',
        resourceId: distribution.id,
        metadata: {
          reservationId: distribution.reservationId.toString(),
          quantity: distribution.quantity,
        },
      },
      session,
    );

    return distribution;
  });
}

export async function listDistributionHistory(user, { status, page, limit }) {
  const filter = {};

  if (user.role === 'receiver') {
    filter.receiverId = user.id;
  } else if (user.role === 'provider') {
    filter.providerId = user.id;
  }

  if (status) {
    filter.status = status;
  }

  const [items, total] = await Promise.all([
    Distribution.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('listingId', HISTORY_LISTING_FIELDS)
      .populate('reservationId', HISTORY_RESERVATION_FIELDS)
      .populate('providerId', HISTORY_PARTY_FIELDS)
      .populate('receiverId', HISTORY_PARTY_FIELDS),
    Distribution.countDocuments(filter),
  ]);

  return { items, pagination: buildPagination(page, limit, total) };
}
