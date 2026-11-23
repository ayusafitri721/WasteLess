import { z } from 'zod';
import {
  emailSchema,
  geoPointSchema,
  passwordSchema,
} from '../../utils/validation-schemas.js';

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Nama minimal 2 karakter')
      .max(100, 'Nama maksimal 100 karakter'),
    email: emailSchema,
    password: passwordSchema,
    role: z.enum(['provider', 'receiver'], {
      message: 'Peran harus provider atau receiver',
    }),
    phone: z
      .string()
      .trim()
      .min(8, 'Nomor telepon minimal 8 karakter')
      .max(20, 'Nomor telepon maksimal 20 karakter')
      .optional(),
    organizationName: z
      .string()
      .trim()
      .min(2, 'Nama organisasi minimal 2 karakter')
      .max(150, 'Nama organisasi maksimal 150 karakter')
      .optional(),
    location: geoPointSchema.optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.role === 'receiver' && !data.organizationName) {
      ctx.addIssue({
        code: 'custom',
        path: ['organizationName'],
        message: 'Nama organisasi wajib diisi untuk peran receiver',
      });
    }
  });

export const loginSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1, 'Password wajib diisi'),
  })
  .strict();

export const requestResetSchema = z
  .object({
    email: emailSchema,
  })
  .strict();

export const resetPasswordSchema = z
  .object({
    token: z
      .string()
      .min(20, 'Token reset tidak valid')
      .max(200, 'Token reset tidak valid'),
    password: passwordSchema,
  })
  .strict();
