import mongoose from 'mongoose';
import { Distribution } from '../distributions/distribution.model.js';
import { DISTRIBUTION_STATUSES } from '../distributions/distribution.constants.js';
import { FoodListing } from '../foods/food.model.js';
import { FOOD_STATUSES } from '../foods/food.constants.js';
import { Reservation } from '../reservations/reservation.model.js';
import { RESERVATION_STATUSES } from '../reservations/reservation.constants.js';
import { User } from '../users/user.model.js';

const USER_ROLES = ['provider', 'receiver', 'admin'];

function objectId(id) {
  return new mongoose.Types.ObjectId(id);
}

function countByStatus(rows, statuses) {
  const counts = Object.fromEntries(statuses.map((status) => [status, 0]));

  for (const row of rows) {
    if (row._id in counts) {
      counts[row._id] = row.count;
    }
  }

  return counts;
}

function totalFrom(counts) {
  return Object.values(counts).reduce((total, count) => total + count, 0);
}

function quantityRows(rows) {
  return rows.map((row) => ({
    unit: row._id,
    quantity: row.quantity,
    distributions: row.distributions,
  }));
}

async function statusCounts(Model, match) {
  return Model.aggregate([
    { $match: match },
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
}

async function completedQuantityByUnit(match) {
  return Distribution.aggregate([
    { $match: { ...match, status: 'completed' } },
    {
      $group: {
        _id: '$unit',
        quantity: { $sum: '$quantity' },
        distributions: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
}

export async function getProviderAnalytics(userId) {
  const providerId = objectId(userId);

  const [listingRows, reservationRows, distributionRows, quantityByUnit] =
    await Promise.all([
      statusCounts(FoodListing, { providerId }),
      statusCounts(Reservation, { providerId }),
      statusCounts(Distribution, { providerId }),
      completedQuantityByUnit({ providerId }),
    ]);

  const listingsByStatus = countByStatus(listingRows, FOOD_STATUSES);
  const reservationsByStatus = countByStatus(
    reservationRows,
    RESERVATION_STATUSES,
  );
  const distributionsByStatus = countByStatus(
    distributionRows,
    DISTRIBUTION_STATUSES,
  );

  return {
    listings: {
      total: totalFrom(listingsByStatus),
      byStatus: listingsByStatus,
    },
    reservations: {
      total: totalFrom(reservationsByStatus),
      byStatus: reservationsByStatus,
    },
    distributions: {
      total: totalFrom(distributionsByStatus),
      byStatus: distributionsByStatus,
    },
    completedQuantityByUnit: quantityRows(quantityByUnit),
  };
}

export async function getReceiverAnalytics(userId) {
  const receiverId = objectId(userId);

  const [reservationRows, distributionRows, quantityByUnit] =
    await Promise.all([
      statusCounts(Reservation, { receiverId }),
      statusCounts(Distribution, { receiverId }),
      completedQuantityByUnit({ receiverId }),
    ]);

  const reservationsByStatus = countByStatus(
    reservationRows,
    RESERVATION_STATUSES,
  );
  const distributionsByStatus = countByStatus(
    distributionRows,
    DISTRIBUTION_STATUSES,
  );

  return {
    reservations: {
      total: totalFrom(reservationsByStatus),
      byStatus: reservationsByStatus,
    },
    distributions: {
      total: totalFrom(distributionsByStatus),
      byStatus: distributionsByStatus,
    },
    completedQuantityByUnit: quantityRows(quantityByUnit),
  };
}

export async function getPlatformAnalytics() {
  const [
    userRows,
    verifiedUsers,
    listingRows,
    reservationRows,
    distributionRows,
    quantityByUnit,
  ] = await Promise.all([
    User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    User.countDocuments({ verificationStatus: 'verified' }),
    statusCounts(FoodListing, {}),
    statusCounts(Reservation, {}),
    statusCounts(Distribution, {}),
    completedQuantityByUnit({}),
  ]);

  const usersByRole = Object.fromEntries(
    USER_ROLES.map((role) => [role, 0]),
  );

  for (const row of userRows) {
    if (row._id in usersByRole) {
      usersByRole[row._id] = row.count;
    }
  }

  const listingsByStatus = countByStatus(listingRows, FOOD_STATUSES);
  const reservationsByStatus = countByStatus(
    reservationRows,
    RESERVATION_STATUSES,
  );
  const distributionsByStatus = countByStatus(
    distributionRows,
    DISTRIBUTION_STATUSES,
  );

  return {
    users: {
      total: totalFrom(usersByRole),
      verified: verifiedUsers,
      byRole: usersByRole,
    },
    listings: {
      total: totalFrom(listingsByStatus),
      byStatus: listingsByStatus,
    },
    reservations: {
      total: totalFrom(reservationsByStatus),
      byStatus: reservationsByStatus,
    },
    distributions: {
      total: totalFrom(distributionsByStatus),
      byStatus: distributionsByStatus,
    },
    completedQuantityByUnit: quantityRows(quantityByUnit),
  };
}
