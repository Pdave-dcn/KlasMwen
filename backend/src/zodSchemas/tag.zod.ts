import { z } from "zod";

const CreateTagSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "The tag name must be at least 2 characters")
      .max(30, "The tag name must be at most 30 characters")
      .regex(
        /^[\p{L}\s]+$/u,
        "The tag name can only contain letters and spaces."
      )
      .refine((val) => {
        const words = val.trim().replace(/\s+/g, " ").split(" ");
        return words.length <= 2;
      }, "The tag name must be one or two words only."),
  })
  .strict();

const TagIdParamSchema = z.object({
  id: z
    .string("Tag ID must be a string")
    .trim()
    .min(1, "Tag ID cannot be empty")
    .regex(/^[0-9]+$/, "Tag ID must contain only digits")
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val), {
      message: "Tag ID must be a valid number",
    })
    .refine((val) => val > 0, {
      message: "Tag ID must be a positive number",
    })
    .refine((val) => Number.isSafeInteger(val), {
      message: "Tag ID exceeds maximum safe integer",
    }),
});

export { CreateTagSchema, TagIdParamSchema };
