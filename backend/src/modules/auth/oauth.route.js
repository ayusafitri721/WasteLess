import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import * as oauthController from './oauth.controller.js';
import {
  callbackQuerySchema,
  exchangeSchema,
  providerParamSchema,
  startQuerySchema,
} from './oauth.validation.js';

const router = Router();

router.get(
  '/:provider/start',
  validate({ params: providerParamSchema, query: startQuerySchema }),
  oauthController.start,
);
router.get(
  '/:provider/callback',
  validate({ params: providerParamSchema, query: callbackQuerySchema }),
  oauthController.callback,
);
router.post(
  '/exchange',
  validate({ body: exchangeSchema }),
  oauthController.exchange,
);

export default router;
