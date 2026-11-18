import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import * as controller from './analytics.controller.js';

const router = Router();

router.get(
  '/provider',
  authenticate,
  authorize('provider'),
  controller.provider,
);
router.get(
  '/receiver',
  authenticate,
  authorize('receiver'),
  controller.receiver,
);
router.get('/platform', authenticate, authorize('admin'), controller.platform);

export default router;
