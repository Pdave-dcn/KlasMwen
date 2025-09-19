import { z } from "zod";

const AvatarDataSchema = z.object({
  id: z.number().int(),
  url: z.url(),
});

const AvatarServerResponseSchema = z.object({
  data: z.array(AvatarDataSchema),
  pagination: z.object({
    hasMore: z.boolean(),
    nextCursor: z.number().int().nullable(),
  }),
});

export { AvatarServerResponseSchema };
