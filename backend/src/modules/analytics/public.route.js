import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { Distribution } from '../distributions/distribution.model.js';
import { FoodListing } from '../foods/food.model.js';
import { Reservation } from '../reservations/reservation.model.js';
import { User } from '../users/user.model.js';

const router = Router();

const limiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});

router.get('/stats', limiter, async (req, res, next) => {
  try {
    const [providers, receivers, listings, reservations, distributions] =
      await Promise.all([
        User.countDocuments({ role: 'provider' }),
        User.countDocuments({ role: 'receiver' }),
        FoodListing.countDocuments({}),
        Reservation.countDocuments({}),
        Distribution.aggregate([
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
            },
          },
        ]),
      ]);

    const distributionCounts = Object.fromEntries(
      distributions.map((row) => [row._id, row.count]),
    );

    res.json({
      success: true,
      data: {
        users: { providers, receivers },
        listings,
        reservations,
        distributions: {
          total: Object.values(distributionCounts).reduce(
            (sum, count) => sum + count,
            0,
          ),
          completed: distributionCounts.completed ?? 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
