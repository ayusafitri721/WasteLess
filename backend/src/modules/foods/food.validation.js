import { z } from 'zod';
import {
  geoPointSchema,
  isoDateTimeSchema,
  objectIdSchema,
} from '../../utils/validation-schemas.js';
import {
  FOOD_CATEGORIES,
  FOOD_STATUSES,
  FOOD_UNITS,
} from './food.constants.js';

const isoDateSchema = isoDateTimeSchema;

const nameSchema = z
  .string()
  .trim()
  .min(2, 'Nama makanan minimal 2 karakter')
  .max(150, 'Nama makanan maksimal 150 karakter');

const descriptionSchema = z
  .string()
  .trim()
  .min(10, 'Deskripsi minimal 10 karakter')
  .max(2000, 'Deskripsi maksimal 2000 karakter');

const categorySchema = z.enum(FOOD_CATEGORIES, {
  message: 'Kategori tidak dikenal',
});

const unitSchema = z.enum(FOOD_UNITS, {
  message: 'Satuan tidak dikenal',
});

const allergensSchema = z
  .array(
    z
      .string()
      .trim()
      .min(1, 'Nama alergen tidak boleh kosong')
      .max(50, 'Nama alergen maksimal 50 karakter'),
  )
  .max(20, 'Maksimal 20 alergen');

const storageInstructionsSchema = z
  .string()
  .trim()
  .max(500, 'Instruksi penyimpanan maksimal 500 karakter');

const pickupAddressSchema = z
  .string()
  .trim()
  .min(5, 'Alamat pengambilan minimal 5 karakter')
  .max(300, 'Alamat pengambilan maksimal 300 karakter');

const futureDeadlineSchema = isoDateSchema.refine(
  (value) => value.getTime() > Date.now(),
  'Batas waktu pengambilan harus setelah waktu sekarang',
);

export const createFoodSchema = z
  .object({
    name: nameSchema,
    description: descriptionSchema,
    category: categorySchema,
    quantity: z
      .number({ message: 'Jumlah harus berupa angka' })
      .positive('Jumlah harus lebih dari 0')
      .max(100000, 'Jumlah maksimal 100000'),
    unit: unitSchema,
    productionDate: isoDateSchema,
    expiryDate: isoDateSchema.optional(),
    pickupDeadline: futureDeadlineSchema,
    allergens: allergensSchema.optional(),
    storageInstructions: storageInstructionsSchema.optional(),
    pickupAddress: pickupAddressSchema,
    location: geoPointSchema.optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.productionDate > data.pickupDeadline) {
      ctx.addIssue({
        code: 'custom',
        path: ['productionDate'],
        message: 'Tanggal produksi tidak boleh setelah batas pengambilan',
      });
    }

    if (data.expiryDate && data.expiryDate < data.productionDate) {
      ctx.addIssue({
        code: 'custom',
        path: ['expiryDate'],
        message: 'Tanggal kedaluwarsa tidak boleh sebelum tanggal produksi',
      });
    }
  });

export const updateFoodSchema = z
  .object({
    name: nameSchema.optional(),
    description: descriptionSchema.optional(),
    category: categorySchema.optional(),
    unit: unitSchema.optional(),
    productionDate: isoDateSchema.optional(),
    expiryDate: isoDateSchema.optional(),
    pickupDeadline: futureDeadlineSchema.optional(),
    allergens: allergensSchema.optional(),
    storageInstructions: storageInstructionsSchema.optional(),
    pickupAddress: pickupAddressSchema.optional(),
    location: geoPointSchema.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Minimal satu field harus diperbarui',
  });

const paginationFields = {
  category: categorySchema.optional(),
  q: z.string().trim().max(100, 'Kata kunci maksimal 100 karakter').optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

export const listFoodsQuerySchema = z.object(paginationFields).strict();

export const listMyFoodsQuerySchema = z
  .object({
    ...paginationFields,
    status: z.enum(FOOD_STATUSES, { message: 'Status tidak dikenal' }).optional(),
  })
  .strict();

export const foodIdSchema = z.object({
  id: objectIdSchema,
});
