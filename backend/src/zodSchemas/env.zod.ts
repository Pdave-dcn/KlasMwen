import { z } from "zod";

const baseSchema = z.object({
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

  // ADMIN FIELDS
  ADMIN_USERNAME: z
    .string()
    .trim()
    .min(3)
    .max(50)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .default("admin_user"),

  ADMIN_EMAIL: z
    .email("ADMIN_EMAIL must be a valid email address.")
    .default("admin@example.com"),

  ADMIN_PASSWORD: z
    .string()
    .trim()
    .min(8)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .regex(/^[\u0020-\u007E]+$/)
    .default("Admin123"),

  // GUEST FIELDS
  GUEST_USERNAME: z
    .string()
    .trim()
    .min(3)
    .max(50)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .default("guest_user"),

  GUEST_EMAIL: z
    .email("GUEST_EMAIL must be a valid email address.")
    .default("guest@example.com"),

  GUEST_PASSWORD: z
    .string()
    .trim()
    .min(8)
    .regex(/^[\u0020-\u007E]+$/)
    .default("Guest123"),
});

// Enforce production rules
const envSchema = baseSchema.superRefine((vals, ctx) => {
  if (vals.NODE_ENV === "production") {
    const requiredFields: (keyof typeof vals)[] = [
      "ADMIN_USERNAME",
      "ADMIN_EMAIL",
      "ADMIN_PASSWORD",
    ];

    for (const field of requiredFields) {
      if (!process.env[field] || process.env[field] === "") {
        ctx.addIssue({
          code: "custom",
          message: `${field} is required in production and must be set in the environment.`,
          path: [field],
        });
      }
    }
  }
});

export default envSchema;
