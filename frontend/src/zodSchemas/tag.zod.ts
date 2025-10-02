import { z } from "zod";

const TagDataSchema = z.object({
  id: z.number().int(),
  name: z.string(),
});

const TagResponseSchema = z.object({
  data: z.array(TagDataSchema),
});

export { TagResponseSchema };
