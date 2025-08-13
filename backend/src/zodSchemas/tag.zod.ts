import { z } from "zod";

const CreateTagSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "The tag name must be at least 2 characters")
    .max(20, "The tag name must be at most 30 characters"),
});

export { CreateTagSchema };
