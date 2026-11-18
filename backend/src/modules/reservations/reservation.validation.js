import { z } from 'zod';
import {
  isoDateTimeSchema,
  objectIdSchema,
} from '../../utils/validation-schemas.js';
import { RESERVATION_STATUSES } from './reservation.constants.js';

const futureScheduleSchema = isoDateTimeSchema.refine(
  (value) => value.getTime() > Date.now(),
  'Jadwal pengambilan harus setelah waktu sekarang',
);

const noteSchema = z
  .string()
  .trim()
  .max(500, 'Catatan maksimal 500 karakter');

export const createReservationSchema = z
  .object({
    listingId: objectIdSchema,
    quantity: z
      .number({ message: 'Jumlah harus berupa angka' })
      .positive('Jumlah harus lebih dari 0')
      .max(100000, 'Jumlah maksimal 100000'),
    pickupSchedule: futureScheduleSchema.optional(),
  })
  .strict();

export const approveReservationSchema = z
  .object({
    pickupSchedule: futureScheduleSchema.optional(),
    note: noteSchema.optional(),
  })
  .strict()
  .default({});

export const rejectReservationSchema = z
  .object({
    reason: z
      .string()
      .trim()
      .min(3, 'Alasan penolakan minimal 3 karakter')
      .max(500, 'Alasan penolakan maksimal 500 karakter'),
  })
  .strict();

export const cancelReservationSchema = z
  .object({
    reason: z
      .string()
      .trim()
      .min(3, 'Alasan pembatalan minimal 3 karakter')
      .max(500, 'Alasan pembatalan maksimal 500 karakter')
      .optional(),
  })
  .strict()
  .default({});

export const reservationIdSchema = z.object({
  id: objectIdSchema,
});

export const listReservationsQuerySchema = z
  .object({
    status: z
      .enum(RESERVATION_STATUSES, { message: 'Status tidak dikenal' })
      .optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();
