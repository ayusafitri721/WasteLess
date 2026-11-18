import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import * as verificationController from './verification.controller.js';
import { submitVerificationSchema } from './verification.validation.js';

const router = Router();

router.post(
  '/',
  authenticate,
  authorize('provider', 'receiver'),
  validate({ body: submitVerificationSchema }),
  verificationController.submit,
);

export default router;
