import { z } from "zod";

const CreateCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Comment content cannot be empty.")
    .max(2000, "Comment content cannot exceed 2000 characters."),

  parentId: z.number().int().positive().optional(),
});

export { CreateCommentSchema };
