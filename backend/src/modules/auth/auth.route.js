import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../../config/env.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { validate } from '../../middlewares/validate.js';
import * as authController from './auth.controller.js';
import {
  loginSchema,
  registerSchema,
  requestResetSchema,
  resetPasswordSchema,
} from './auth.validation.js';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.NODE_ENV === 'development' ? 100 : 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skip: () => env.NODE_ENV === 'test',
  handler(req, res) {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Terlalu banyak percobaan. Coba lagi nanti.',
      },
    });
  },
});

const router = Router();

router.post(
  '/register',
  authLimiter,
  validate({ body: registerSchema }),
  authController.register,
);
router.post(
  '/login',
  authLimiter,
  validate({ body: loginSchema }),
  authController.login,
);
router.post(
  '/forgot-password',
  authLimiter,
  validate({ body: requestResetSchema }),
  authController.requestReset,
);
router.post(
  '/reset-password',
  authLimiter,
  validate({ body: resetPasswordSchema }),
  authController.resetPassword,
);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);

export default router;
