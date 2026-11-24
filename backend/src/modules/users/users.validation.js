import { z } from 'zod';
import { normalizeAvatarDataUrl } from '../../utils/avatar.js';
import { geoPointSchema } from '../../utils/validation-schemas.js';

const avatarSchema = z
  .string()
  .max(800000, 'Foto profil terlalu besar')
  .transform((value, ctx) => {
    try {
      return normalizeAvatarDataUrl(value);
    } catch {
      ctx.addIssue({
        code: 'custom',
        message: 'Format foto profil harus PNG atau JPEG',
      });
      return z.NEVER;
    }
  });

export const updateProfileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Nama minimal 2 karakter')
      .max(100, 'Nama maksimal 100 karakter')
      .optional(),
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
    avatar: avatarSchema.nullable().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Minimal satu field harus diperbarui',
  });
