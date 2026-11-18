import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import * as reservationController from './reservation.controller.js';
import {
  approveReservationSchema,
  cancelReservationSchema,
  createReservationSchema,
  listReservationsQuerySchema,
  rejectReservationSchema,
  reservationIdSchema,
} from './reservation.validation.js';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  authorize('receiver'),
  validate({ body: createReservationSchema }),
  reservationController.create,
);

router.get(
  '/my',
  validate({ query: listReservationsQuerySchema }),
  reservationController.listMine,
);

router.get(
  '/:id',
  validate({ params: reservationIdSchema }),
  reservationController.detail,
);

router.patch(
  '/:id/approve',
  authorize('provider'),
  validate({
    params: reservationIdSchema,
    body: approveReservationSchema,
  }),
  reservationController.approve,
);

router.patch(
  '/:id/reject',
  authorize('provider'),
  validate({
    params: reservationIdSchema,
    body: rejectReservationSchema,
  }),
  reservationController.reject,
);

router.patch(
  '/:id/cancel',
  validate({
    params: reservationIdSchema,
    body: cancelReservationSchema,
  }),
  reservationController.cancel,
);

router.patch(
  '/:id/ready',
  authorize('provider'),
  validate({ params: reservationIdSchema }),
  reservationController.readyForPickup,
);

export default router;
