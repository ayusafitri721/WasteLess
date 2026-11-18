import { ApiError } from '../../utils/ApiError.js';
import { runInTransaction } from '../../utils/transaction.js';
import { logActivity } from '../activity-logs/activity-log.service.js';
import { ACTIVE_RESERVATION_STATUSES } from '../reservations/reservation.constants.js';
import { Reservation } from '../reservations/reservation.model.js';
import { FoodListing } from './food.model.js';

const PROVIDER_FIELDS = 'name organizationName verificationStatus';

async function hasActiveReservations(listingId) {
  return Reservation.exists({
    listingId,
    status: { $in: ACTIVE_RESERVATION_STATUSES },
  });
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildSearchFilter({ category, q }) {
  const filter = {};

  if (category) {
    filter.category = category;
  }

  if (q) {
    const pattern = escapeRegex(q);
    filter.$or = [
      { name: { $regex: pattern, $options: 'i' } },
      { description: { $regex: pattern, $options: 'i' } },
    ];
  }

  return filter;
}

function buildPagination(page, limit, total) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

export async function createFoodListing(user, input) {
  if (user.verificationStatus !== 'verified') {
    throw new ApiError(
      403,
      'PROVIDER_NOT_VERIFIED',
      'Akun penyedia harus terverifikasi untuk membuat listing',
    );
  }

  return runInTransaction(async (session) => {
    const [listing] = await FoodListing.create(
      [
        {
          providerId: user.id,
          ...input,
          availableQuantity: input.quantity,
          status: 'available',
        },
      ],
      { session },
    );

    await logActivity(
      {
        actorId: user.id,
        action: 'food_listing.created',
        resourceType: 'FoodListing',
        resourceId: listing.id,
        metadata: { category: listing.category },
      },
      session,
    );

    return listing;
  });
}

export async function listAvailableFoods({ category, q, page, limit }) {
  const filter = {
    ...buildSearchFilter({ category, q }),
    status: 'available',
    pickupDeadline: { $gt: new Date() },
  };

  const [items, total] = await Promise.all([
    FoodListing.find(filter)
      .sort({ pickupDeadline: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('providerId', PROVIDER_FIELDS),
    FoodListing.countDocuments(filter),
  ]);

  return { items, pagination: buildPagination(page, limit, total) };
}

export async function listOwnFoods(providerId, { status, category, q, page, limit }) {
  const filter = {
    ...buildSearchFilter({ category, q }),
    providerId,
  };

  if (status) {
    filter.status = status;
  }

  const [items, total] = await Promise.all([
    FoodListing.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    FoodListing.countDocuments(filter),
  ]);

  return { items, pagination: buildPagination(page, limit, total) };
}

export async function getFoodListing(user, listingId) {
  const listing = await FoodListing.findById(listingId);

  if (!listing) {
    throw new ApiError(404, 'FOOD_NOT_FOUND', 'Listing tidak ditemukan');
  }

  const isOwner = listing.providerId.equals(user.id);
  const isAdmin = user.role === 'admin';
  const isPubliclyVisible =
    listing.status === 'available' && listing.pickupDeadline > new Date();

  if (!isPubliclyVisible && !isOwner && !isAdmin) {
    throw new ApiError(404, 'FOOD_NOT_FOUND', 'Listing tidak ditemukan');
  }

  await listing.populate('providerId', PROVIDER_FIELDS);

  return listing;
}

export async function updateFoodListing(user, listingId, input) {
  const existing = await FoodListing.findById(listingId);

  if (!existing) {
    throw new ApiError(404, 'FOOD_NOT_FOUND', 'Listing tidak ditemukan');
  }

  if (!existing.providerId.equals(user.id)) {
    throw new ApiError(
      403,
      'FORBIDDEN',
      'Anda hanya dapat mengubah listing milik sendiri',
    );
  }

  if (existing.status !== 'available') {
    throw new ApiError(
      409,
      'LISTING_NOT_EDITABLE',
      'Listing hanya dapat diubah saat berstatus available',
    );
  }

  if (await hasActiveReservations(listingId)) {
    throw new ApiError(
      409,
      'LISTING_HAS_ACTIVE_RESERVATIONS',
      'Listing dengan reservasi aktif tidak dapat diubah',
    );
  }

  const productionDate = input.productionDate ?? existing.productionDate;
  const expiryDate = input.expiryDate ?? existing.expiryDate;

  if (expiryDate && expiryDate < productionDate) {
    throw new ApiError(
      422,
      'VALIDATION_ERROR',
      'Data permintaan tidak valid',
      [
        {
          path: 'expiryDate',
          message: 'Tanggal kedaluwarsa tidak boleh sebelum tanggal produksi',
        },
      ],
    );
  }

  return runInTransaction(async (session) => {
    const listing = await FoodListing.findOneAndUpdate(
      { _id: listingId, providerId: user.id, status: 'available' },
      { $set: input },
      { returnDocument: 'after', runValidators: true, session },
    );

    if (!listing) {
      throw new ApiError(
        409,
        'LISTING_NOT_EDITABLE',
        'Listing berubah status, silakan muat ulang data',
      );
    }

    await logActivity(
      {
        actorId: user.id,
        action: 'food_listing.updated',
        resourceType: 'FoodListing',
        resourceId: listing.id,
        metadata: { fields: Object.keys(input) },
      },
      session,
    );

    return listing;
  });
}

export async function cancelFoodListing(user, listingId) {
  const existing = await FoodListing.findById(listingId);

  if (!existing) {
    throw new ApiError(404, 'FOOD_NOT_FOUND', 'Listing tidak ditemukan');
  }

  if (!existing.providerId.equals(user.id)) {
    throw new ApiError(
      403,
      'FORBIDDEN',
      'Anda hanya dapat menutup listing milik sendiri',
    );
  }

  if (await hasActiveReservations(listingId)) {
    throw new ApiError(
      409,
      'LISTING_HAS_ACTIVE_RESERVATIONS',
      'Listing dengan reservasi aktif tidak dapat ditutup',
    );
  }

  return runInTransaction(async (session) => {
    const listing = await FoodListing.findOneAndUpdate(
      { _id: listingId, providerId: user.id, status: 'available' },
      { $set: { status: 'cancelled' } },
      { returnDocument: 'after', session },
    );

    if (!listing) {
      throw new ApiError(
        409,
        'LISTING_NOT_CANCELLABLE',
        'Listing hanya dapat ditutup saat berstatus available',
      );
    }

    await logActivity(
      {
        actorId: user.id,
        action: 'food_listing.cancelled',
        resourceType: 'FoodListing',
        resourceId: listing.id,
      },
      session,
    );

    return listing;
  });
}
