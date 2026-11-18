import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().max(65535).default(5000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI wajib diisi'),
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, 'JWT_ACCESS_SECRET minimal 32 karakter'),
  JWT_ACCESS_EXPIRES_IN: z.string().min(1).default('15m'),
  CLIENT_ORIGIN: z.url('CLIENT_ORIGIN harus berupa URL yang valid'),
  EXPIRATION_JOB_INTERVAL_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(60000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `- ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  console.error(`Konfigurasi environment tidak valid:\n${details}`);
  process.exit(1);
}

export const env = parsed.data;
