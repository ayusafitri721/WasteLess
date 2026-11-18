import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../../config/env.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import * as distributionController from './distribution.controller.js';
import {
  distributionIdSchema,
  listDistributionsQuerySchema,
  verifyPickupSchema,
} from './distribution.validation.js';

const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  handler(req, res) {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Terlalu banyak percobaan verifikasi. Coba lagi nanti.',
      },
    });
  },
});

const router = Router();

router.use(authenticate);

router.get(
  '/history',
  validate({ query: listDistributionsQuerySchema }),
  distributionController.history,
);

router.patch(
  '/:id/verify-pickup',
  authorize('provider'),
  verifyLimiter,
  validate({
    params: distributionIdSchema,
    body: verifyPickupSchema,
  }),
  distributionController.verifyPickup,
);

router.patch(
  '/:id/complete',
  authorize('receiver'),
  validate({ params: distributionIdSchema }),
  distributionController.complete,
);

export default router;
