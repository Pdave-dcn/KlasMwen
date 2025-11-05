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
    .refine((val) => /^\d+$/.test(val), {
      message: "Comment ID must contain only digits",
    })
    .refine((val) => !isNaN(parseInt(val, 10)), {
      message: "Comment ID must be a valid number",
    })
    .refine((val) => parseInt(val, 10) > 0, {
      message: "Comment ID must be a positive number",
    })
    .refine((val) => Number.isSafeInteger(parseInt(val, 10)), {
      message: "Comment ID exceeds maximum safe integer",
    })
    .transform((val) => parseInt(val, 10)),
});

export { CreateCommentSchema, CommentIdParamSchema };
