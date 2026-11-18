import { z } from 'zod';
import { objectIdSchema } from '../../utils/validation-schemas.js';

const documentUrlSchema = z
  .string()
  .trim()
  .max(500, 'URL dokumen maksimal 500 karakter')
  .url('URL dokumen tidak valid')
  .refine(
    (value) => /^https?:\/\//i.test(value),
    'URL dokumen harus menggunakan http atau https',
  );

export const submitVerificationSchema = z
  .object({
    organizationName: z
      .string()
      .trim()
      .min(2, 'Nama organisasi minimal 2 karakter')
      .max(150, 'Nama organisasi maksimal 150 karakter'),
    contactPhone: z
      .string()
      .trim()
      .min(8, 'Nomor kontak minimal 8 karakter')
      .max(20, 'Nomor kontak maksimal 20 karakter'),
    supportingDocumentUrl: documentUrlSchema.optional(),
    notes: z
      .string()
      .trim()
      .max(1000, 'Catatan maksimal 1000 karakter')
      .optional(),
  })
  .strict();

export const decideVerificationSchema = z
  .object({
    decision: z.enum(['approved', 'rejected'], {
      message: 'Keputusan harus approved atau rejected',
    }),
    reviewNote: z
      .string()
      .trim()
      .max(1000, 'Catatan maksimal 1000 karakter')
      .optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.decision === 'rejected' && !data.reviewNote) {
      ctx.addIssue({
        code: 'custom',
        path: ['reviewNote'],
        message: 'Alasan penolakan wajib diisi',
      });
    }
  });

export const verificationIdSchema = z.object({
  id: objectIdSchema,
});

export const listVerificationsQuerySchema = z
  .object({
    status: z
      .enum(['pending', 'approved', 'rejected', 'all'])
      .default('pending'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();
