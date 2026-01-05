import { NotificationType } from "@prisma/client";
import { z } from "zod";

const NotificationsQuerySchema = z.object({
  read: z.boolean().optional(),
  type: z.enum(NotificationType).optional(),
});

const NotificationIdParamSchema = z.object({
  id: z
    .string("Notification ID must be a string")
    .trim()
    .min(1, "Notification ID cannot be empty")
    .regex(/^[0-9]+$/, "Notification ID must contain only digits")
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val), {
      message: "Notification ID must be a valid number",
    })
    .refine((val) => val > 0, {
      message: "Notification ID must be a positive number",
    })
    .refine((val) => Number.isSafeInteger(val), {
      message: "Notification ID exceeds maximum safe integer",
    }),
});

export { NotificationsQuerySchema, NotificationIdParamSchema };
