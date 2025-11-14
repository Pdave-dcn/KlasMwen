import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.url().refine((val) => val.startsWith("postgresql://"), {
    message: "DATABASE_URL must be a valid PostgreSQL connection string",
  }),
  ALLOWED_ORIGIN: z.url(),
  JWT_SECRET: z
    .string()
    .min(10, "JWT_SECRET must be at least 10 characters long"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),
  CLOUDINARY_CLOUD_NAME: z.string().min(1, "CLOUDINARY_CLOUD_NAME is required"),
  CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY is required"),
  CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET is required"),
  ADMIN_USERNAME: z
    .string()
    .trim()
    .min(3, "ADMIN_USERNAME must be at least 3 characters.")
    .max(50, "ADMIN_USERNAME must be less than 50 characters.")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "ADMIN_USERNAME can only contain letters, numbers, underscores, and hyphens."
    )
    .default("admin_user"),
  ADMIN_EMAIL: z
    .email("ADMIN_EMAIL must be a valid email address.")
    .default("admin@example.com"),
  ADMIN_PASSWORD: z
    .string()
    .trim()
    .min(8, "ADMIN_PASSWORD must be at least 8 characters.")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "ADMIN_PASSWORD must contain at least one uppercase letter, one lowercase letter, and one number."
    )
    .regex(
      /^[\u0020-\u007E]+$/,
      "ADMIN_PASSWORD must not contain emojis or special Unicode characters."
    )
    .default("Admin123"),
});

export default envSchema;
