import { z } from 'zod';

export const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, 'Identifier tidak valid');

export const geoPointSchema = z
  .object({
    type: z.literal('Point').default('Point'),
    coordinates: z.tuple([
      z.number().min(-180, 'Longitude minimal -180').max(180, 'Longitude maksimal 180'),
      z.number().min(-90, 'Latitude minimal -90').max(90, 'Latitude maksimal 90'),
    ]),
  })
  .strict();

export const emailSchema = z
  .string()
  .max(254, 'Email maksimal 254 karakter')
  .trim()
  .toLowerCase()
  .pipe(z.email('Format email tidak valid'));

export const passwordSchema = z
  .string()
  .min(8, 'Password minimal 8 karakter')
  .max(72, 'Password maksimal 72 karakter');

export const isoDateTimeSchema = z.iso
  .datetime({ offset: true, message: 'Tanggal harus berformat ISO 8601' })
  .transform((value) => new Date(value));
