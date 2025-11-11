import { z } from "zod";

const rawEnv = {
  AUTH_USERNAME: process.env.AUTH_USERNAME,
  AUTH_PASSWORD: process.env.AUTH_PASSWORD,
  AUTH_SECRET: process.env.AUTH_SECRET,
  APP_BASE_URL: process.env.APP_BASE_URL ?? "http://localhost:3000",
};

const envSchema = z.object({
  AUTH_USERNAME: z.string().min(1, "AUTH_USERNAME is required"),
  AUTH_PASSWORD: z.string().min(1, "AUTH_PASSWORD is required"),
  AUTH_SECRET: z
    .string()
    .min(
      32,
      "AUTH_SECRET must be at least 32 characters to ensure encryption safety",
    ),
  APP_BASE_URL: z.string().url("APP_BASE_URL must be a valid URL"),
});

export const env = envSchema.parse(rawEnv);


