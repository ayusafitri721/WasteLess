import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { validate } from '../../middlewares/validate.js';
import * as usersController from './users.controller.js';
import { updateProfileSchema } from './users.validation.js';

const router = Router();

router.use(authenticate);

router.get('/me', usersController.me);
router.patch(
  '/me',
  validate({ body: updateProfileSchema }),
  usersController.updateMe,
);

export default router;
