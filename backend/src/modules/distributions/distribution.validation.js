import { z } from 'zod';
import { objectIdSchema } from '../../utils/validation-schemas.js';
import { DISTRIBUTION_STATUSES } from './distribution.constants.js';

export const distributionIdSchema = z.object({
  id: objectIdSchema,
});

export const verifyPickupSchema = z
  .object({
    code: z
      .string()
      .trim()
      .regex(/^\d{6}$/, 'Kode pengambilan harus 6 digit angka'),
  })
  .strict();

export const listDistributionsQuerySchema = z
  .object({
    status: z
      .enum(DISTRIBUTION_STATUSES, { message: 'Status tidak dikenal' })
      .optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();
