import { z } from "zod";

import { UserDataSchema } from "./user.zod";

const SignInSchema = z.object({
  email: z.email("Please enter a valid email address."),

  password: z
    .string()
    .trim()
    .min(1, "Password is required.")
    .min(8, "Password must be at least 8 characters.")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number."
    )
    .regex(
      /^[\u0020-\u007E]+$/,
      "Password must not contain emojis or special Unicode characters."
    ),
});

const RegisterSchema = SignInSchema.extend({
  username: z
    .string()
    .trim()
    .min(1, "Username is required.")
    .min(3, "Username must be at least 3 characters.")
    .max(50, "Username must be less than 50 characters.")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username can only contain letters, numbers, underscores, and hyphens."
    ),
});

const AuthVerificationPayloadSchema = z.object({
  id: z.uuid(),
  username: z.string(),
  email: z.email(),
  role: z.enum(["ADMIN", "STUDENT"]),
});

const AuthResponseSchema = z.object({
  message: z.string(),
  user: UserDataSchema,
});

const AuthVerificationResponseSchema = z.object({
  user: AuthVerificationPayloadSchema,
});

export {
  SignInSchema,
  RegisterSchema,
  AuthResponseSchema,
  AuthVerificationResponseSchema,
};
