import { z } from "zod";

const CreateCommentSchema = z.object({
  content: z.string().min(1, "Comment content cannot be empty."),
  parentId: z.number().int().optional(),
});

export { CreateCommentSchema };
