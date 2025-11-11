import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

loadEnv();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z
    .string()
    .optional()
    .transform((value) => {
      if (!value) return 3000;
      const parsed = Number(value);
      if (Number.isNaN(parsed)) {
        throw new Error('PORT must be a valid integer.');
      }
      return parsed;
    }),
  AUTH_USERNAME: z.string().min(1, 'AUTH_USERNAME is required.'),
  AUTH_PASSWORD: z.string().min(1, 'AUTH_PASSWORD is required.'),
  AUTH_SECRET: z
    .string()
    .min(32, 'AUTH_SECRET must be at least 32 characters long for security.'),
});

export const env = envSchema.parse(process.env);

