import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import * as adminVerificationController from './admin-verification.controller.js';
import {
  decideVerificationSchema,
  listVerificationsQuerySchema,
  verificationIdSchema,
} from './verification.validation.js';

const router = Router();

router.use(authenticate, authorize('admin'));

router.get(
  '/',
  validate({ query: listVerificationsQuerySchema }),
  adminVerificationController.list,
);

router.patch(
  '/:id',
  validate({
    params: verificationIdSchema,
    body: decideVerificationSchema,
  }),
  adminVerificationController.decide,
);

export default router;
