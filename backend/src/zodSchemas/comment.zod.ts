import { z } from "zod";

const CreateCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Comment content cannot be empty.")
    .max(780, "Comment content cannot exceed 780 characters."),

  parentId: z.number().int().positive().optional(),
});

const CommentIdParamSchema = z.object({
  id: z
    .string("Comment ID must be a string")
    .trim()
    .min(1, "Comment ID cannot be empty")
    .regex(/^[0-9]+$/, "Comment ID must contain only digits")
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val), {
      message: "Comment ID must be a valid number",
    })
    .refine((val) => val > 0, {
      message: "Comment ID must be a positive number",
    })
    .refine((val) => Number.isSafeInteger(val), {
      message: "Comment ID exceeds maximum safe integer",
    }),
});

export { CreateCommentSchema, CommentIdParamSchema };
