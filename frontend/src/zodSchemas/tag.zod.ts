import { z } from "zod";

const TagDataSchema = z.object({
  id: z.number().int(),
  name: z.string(),
});

const PopularTagDataSchema = TagDataSchema.extend({
  usageCount: z.number().int(),
});

const TagsResponseSchema = z.object({
  data: z.array(TagDataSchema),
});

const PopularTagsResponseSchema = z.object({
  data: z.array(PopularTagDataSchema),
});

export { TagsResponseSchema, PopularTagsResponseSchema };
