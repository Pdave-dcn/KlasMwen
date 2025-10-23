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

export { CreateTagSchema };
