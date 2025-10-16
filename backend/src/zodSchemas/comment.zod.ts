import { z } from "zod";

const CreateCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Comment content cannot be empty.")
    .max(780, "Comment content cannot exceed 780 characters."),

  parentId: z.number().int().positive().optional(),
});

export { CreateCommentSchema };
