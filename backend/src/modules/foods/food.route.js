import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import * as foodController from './food.controller.js';
import {
  createFoodSchema,
  foodIdSchema,
  listFoodsQuerySchema,
  listMyFoodsQuerySchema,
  updateFoodSchema,
} from './food.validation.js';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  authorize('provider'),
  validate({ body: createFoodSchema }),
  foodController.create,
);

router.get(
  '/',
  validate({ query: listFoodsQuerySchema }),
  foodController.list,
);

router.get(
  '/mine',
  authorize('provider'),
  validate({ query: listMyFoodsQuerySchema }),
  foodController.listMine,
);

router.get(
  '/:id',
  validate({ params: foodIdSchema }),
  foodController.detail,
);

router.patch(
  '/:id',
  authorize('provider'),
  validate({ params: foodIdSchema, body: updateFoodSchema }),
  foodController.update,
);

router.delete(
  '/:id',
  authorize('provider'),
  validate({ params: foodIdSchema }),
  foodController.cancel,
);

export default router;
