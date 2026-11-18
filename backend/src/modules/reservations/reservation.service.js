import { ApiError } from '../../utils/ApiError.js';
import { runInTransaction } from '../../utils/transaction.js';
import { logActivity } from '../activity-logs/activity-log.service.js';
import { FoodListing } from '../foods/food.model.js';
import { Reservation } from './reservation.model.js';

const LISTING_FIELDS =
  'name category unit pickupDeadline pickupAddress status availableQuantity';
const PARTY_FIELDS = 'name organizationName phone';

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
    'RESERVATION_NOT_FOUND',
    'Reservasi tidak ditemukan',
  );
}

export async function refundStock(listingId, quantity, session) {
  const listing = await FoodListing.findOneAndUpdate(
    { _id: listingId },
    [
      {
        $set: {
          availableQuantity: { $add: ['$availableQuantity', quantity] },
        },
      },
      {
        $set: {
          status: {
            $cond: [{ $eq: ['$status', 'reserved'] }, 'available', '$status'],
          },
        },
      },
    ],
    { returnDocument: 'after', session, updatePipeline: true },
  );

  if (!listing) {
    throw new ApiError(
      409,
      'LISTING_NOT_FOUND',
      'Listing terkait reservasi tidak ditemukan',
    );
  }
}

export async function createReservation(user, input) {
  if (user.verificationStatus !== 'verified') {
    throw new ApiError(
      403,
      'RECEIVER_NOT_VERIFIED',
      'Akun penerima harus terverifikasi untuk membuat reservasi',
    );
  }

  const now = new Date();

  return runInTransaction(async (session) => {
    const listing = await FoodListing.findOneAndUpdate(
      {
        _id: input.listingId,
        status: 'available',
        pickupDeadline: { $gt: now },
        availableQuantity: { $gte: input.quantity },
        $or: [
          { expiryDate: { $exists: false } },
          { expiryDate: null },
          { expiryDate: { $gt: now } },
        ],
      },
      [
        {
          $set: {
            availableQuantity: {
              $subtract: ['$availableQuantity', input.quantity],
            },
          },
        },
        {
          $set: {
            status: {
              $cond: [
                { $eq: ['$availableQuantity', 0] },
                'reserved',
                'available',
              ],
            },
          },
        },
      ],
      { returnDocument: 'after', session, updatePipeline: true },
    );

    if (!listing) {
      const exists = await FoodListing.exists({
        _id: input.listingId,
      }).session(session);

      if (!exists) {
        throw new ApiError(404, 'FOOD_NOT_FOUND', 'Listing tidak ditemukan');
      }

      throw new ApiError(
        409,
        'LISTING_NOT_AVAILABLE',
        'Listing tidak tersedia, sudah lewat batas waktu, atau stok tidak mencukupi',
      );
    }

    if (
      input.pickupSchedule &&
      input.pickupSchedule > listing.pickupDeadline
    ) {
      throw new ApiError(422, 'VALIDATION_ERROR', 'Data permintaan tidak valid', [
        {
          path: 'pickupSchedule',
          message: 'Jadwal pengambilan tidak boleh melewati batas pengambilan listing',
        },
      ]);
    }

    const [reservation] = await Reservation.create(
      [
        {
          listingId: listing.id,
          providerId: listing.providerId,
          receiverId: user.id,
          quantity: input.quantity,
          pickupSchedule: input.pickupSchedule,
          status: 'pending',
        },
      ],
      { session },
    );

    await logActivity(
      {
        actorId: user.id,
        action: 'reservation.created',
        resourceType: 'Reservation',
        resourceId: reservation.id,
        metadata: {
          listingId: listing.id.toString(),
          quantity: input.quantity,
        },
      },
      session,
    );

    return reservation;
  });
}

export async function listMyReservations(user, { status, page, limit }) {
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
    Reservation.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('listingId', LISTING_FIELDS)
      .populate('providerId', PARTY_FIELDS)
      .populate('receiverId', PARTY_FIELDS),
    Reservation.countDocuments(filter),
  ]);

  return { items, pagination: buildPagination(page, limit, total) };
}

export async function getReservation(user, reservationId) {
  const reservation = await Reservation.findById(reservationId);

  if (!reservation) {
    throw notFoundError();
  }

  const isReceiver = reservation.receiverId.equals(user.id);
  const isProvider = reservation.providerId.equals(user.id);

  if (!isReceiver && !isProvider && user.role !== 'admin') {
    throw new ApiError(
      403,
      'FORBIDDEN',
      'Anda tidak memiliki akses ke reservasi ini',
    );
  }

  await reservation.populate([
    { path: 'listingId', select: LISTING_FIELDS },
    { path: 'providerId', select: PARTY_FIELDS },
    { path: 'receiverId', select: PARTY_FIELDS },
  ]);

  return reservation;
}

export async function approveReservation(user, reservationId, input) {
  return runInTransaction(async (session) => {
    const existing = await Reservation.findById(reservationId).session(session);

    if (!existing) {
      throw notFoundError();
    }

    if (!existing.providerId.equals(user.id)) {
      throw new ApiError(
        403,
        'FORBIDDEN',
        'Hanya penyedia pemilik listing yang dapat menyetujui reservasi',
      );
    }

    if (existing.status !== 'pending') {
      throw new ApiError(
        409,
        'INVALID_STATUS',
        'Reservasi hanya dapat disetujui saat berstatus pending',
      );
    }

    const pickupSchedule = input.pickupSchedule ?? existing.pickupSchedule;

    if (pickupSchedule) {
      const listing = await FoodListing.findById(existing.listingId).session(
        session,
      );

      if (!listing) {
        throw new ApiError(409, 'LISTING_NOT_FOUND', 'Listing tidak ditemukan');
      }

      if (pickupSchedule > listing.pickupDeadline) {
        throw new ApiError(
          422,
          'VALIDATION_ERROR',
          'Data permintaan tidak valid',
          [
            {
              path: 'pickupSchedule',
              message:
                'Jadwal pengambilan tidak boleh melewati batas pengambilan listing',
            },
          ],
        );
      }
    }

    const reservation = await Reservation.findOneAndUpdate(
      { _id: reservationId, providerId: user.id, status: 'pending' },
      {
        $set: {
          status: 'approved',
          approvedAt: new Date(),
          pickupSchedule,
          statusNote: input.note,
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

    await logActivity(
      {
        actorId: user.id,
        action: 'reservation.approved',
        resourceType: 'Reservation',
        resourceId: reservation.id,
        metadata: {
          listingId: reservation.listingId.toString(),
          quantity: reservation.quantity,
        },
      },
      session,
    );

    return reservation;
  });
}

export async function rejectReservation(user, reservationId, reason) {
  return runInTransaction(async (session) => {
    const existing = await Reservation.findById(reservationId).session(session);

    if (!existing) {
      throw notFoundError();
    }

    if (!existing.providerId.equals(user.id)) {
      throw new ApiError(
        403,
        'FORBIDDEN',
        'Hanya penyedia pemilik listing yang dapat menolak reservasi',
      );
    }

    if (existing.status !== 'pending') {
      throw new ApiError(
        409,
        'INVALID_STATUS',
        'Reservasi hanya dapat ditolak saat berstatus pending',
      );
    }

    const reservation = await Reservation.findOneAndUpdate(
      { _id: reservationId, providerId: user.id, status: 'pending' },
      {
        $set: {
          status: 'rejected',
          rejectedAt: new Date(),
          statusNote: reason,
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

    await refundStock(reservation.listingId, reservation.quantity, session);

    await logActivity(
      {
        actorId: user.id,
        action: 'reservation.rejected',
        resourceType: 'Reservation',
        resourceId: reservation.id,
        metadata: {
          listingId: reservation.listingId.toString(),
          quantity: reservation.quantity,
        },
      },
      session,
    );

    return reservation;
  });
}

export async function cancelReservation(user, reservationId, reason) {
  return runInTransaction(async (session) => {
    const existing = await Reservation.findById(reservationId).session(session);

    if (!existing) {
      throw notFoundError();
    }

    const isReceiver = existing.receiverId.equals(user.id);
    const isProvider = existing.providerId.equals(user.id);

    if (!isReceiver && !isProvider) {
      throw new ApiError(
        403,
        'FORBIDDEN',
        'Anda tidak berhak membatalkan reservasi ini',
      );
    }

    const allowedStatuses = isReceiver ? ['pending', 'approved'] : ['approved'];

    if (!allowedStatuses.includes(existing.status)) {
      throw new ApiError(
        409,
        'INVALID_STATUS',
        isReceiver
          ? 'Reservasi hanya dapat dibatalkan saat berstatus pending atau approved'
          : 'Penyedia hanya dapat membatalkan reservasi yang sudah disetujui',
      );
    }

    const filter = {
      _id: reservationId,
      status: { $in: allowedStatuses },
    };

    if (isReceiver) {
      filter.receiverId = user.id;
    } else {
      filter.providerId = user.id;
    }

    const reservation = await Reservation.findOneAndUpdate(
      filter,
      {
        $set: {
          status: 'cancelled',
          cancelledAt: new Date(),
          statusNote: reason,
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

    await refundStock(reservation.listingId, reservation.quantity, session);

    await logActivity(
      {
        actorId: user.id,
        action: 'reservation.cancelled',
        resourceType: 'Reservation',
        resourceId: reservation.id,
        metadata: {
          listingId: reservation.listingId.toString(),
          quantity: reservation.quantity,
          by: user.role,
        },
      },
      session,
    );

    return reservation;
  });
}
