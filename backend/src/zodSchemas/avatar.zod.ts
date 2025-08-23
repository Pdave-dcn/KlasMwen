import { z } from "zod";

const AddAvatarSchema = z.object({
  url: z.url("Must be a valid URL"),
  isDefault: z.boolean().optional(),
});

const AddAvatarsSchema = z.union([
  AddAvatarSchema,
  z.array(AddAvatarSchema).min(1),
]);

const AvatarIdParamSchema = z.object({
  id: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val), "Avatar ID must be a valid number")
    .refine((val) => Number.isInteger(val), "Avatar ID must be an integer")
    .refine((val) => val > 0, "Avatar ID must be positive"),
});

export { AddAvatarSchema, AddAvatarsSchema, AvatarIdParamSchema };
