import { z } from 'zod';

export const providerParamSchema = z
  .object({
    provider: z.enum(['google', 'github'], {
      message: 'Provider harus google atau github',
    }),
  })
  .strict();

export const startQuerySchema = z
  .object({
    role: z.enum(['provider', 'receiver'], {
      message: 'Peran harus provider atau receiver',
    }),
  })
  .strict();

export const callbackQuerySchema = z.object({
  code: z.string().optional(),
  state: z.string().optional(),
  error: z.string().optional(),
});

export const exchangeSchema = z
  .object({
    code: z.string().min(20, 'Kode pertukaran tidak valid').max(200),
  })
  .strict();
