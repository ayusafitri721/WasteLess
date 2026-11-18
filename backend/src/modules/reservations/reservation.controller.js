import * as distributionService from '../distributions/distribution.service.js';
import * as reservationService from './reservation.service.js';

export async function create(req, res) {
  const reservation = await reservationService.createReservation(
    req.user,
    req.validated.body,
  );

  res.status(201).json({
    success: true,
    data: { reservation },
  });
}

export async function listMine(req, res) {
  const { items, pagination } = await reservationService.listMyReservations(
    req.user,
    req.validated.query,
  );

  res.json({
    success: true,
    data: { items, pagination },
  });
}

export async function detail(req, res) {
  const reservation = await reservationService.getReservation(
    req.user,
    req.validated.params.id,
  );

  res.json({
    success: true,
    data: { reservation },
  });
}

export async function approve(req, res) {
  const reservation = await reservationService.approveReservation(
    req.user,
    req.validated.params.id,
    req.validated.body,
  );

  res.json({
    success: true,
    data: { reservation },
  });
}

export async function reject(req, res) {
  const reservation = await reservationService.rejectReservation(
    req.user,
    req.validated.params.id,
    req.validated.body.reason,
  );

  res.json({
    success: true,
    data: { reservation },
  });
}

export async function cancel(req, res) {
  const reservation = await reservationService.cancelReservation(
    req.user,
    req.validated.params.id,
    req.validated.body.reason,
  );

  res.json({
    success: true,
    data: { reservation },
  });
}

export async function readyForPickup(req, res) {
  const result = await distributionService.markPickupReady(
    req.user,
    req.validated.params.id,
  );

  res.json({
    success: true,
    data: result,
  });
}
