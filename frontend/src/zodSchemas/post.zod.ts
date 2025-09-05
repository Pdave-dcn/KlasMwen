import { z } from "zod";

import { AvatarSchema } from "./user.zod";

const AuthorSchema = z
  .object({
    id: z.string(),
    username: z.string(),
    Avatar: AvatarSchema,
  })
  .transform((data) => ({
    id: data.id,
    username: data.username,
    avatar: data.Avatar,
  }));

const TagSchema = z.object({
  id: z.number().int(),
  name: z.string(),
});

const CountSchema = z.object({
  comments: z.number().int(),
  likes: z.number().int(),
});

const PostDataSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string().nullable(),
  type: z.enum(["NOTE", "QUESTION", "RESOURCE"]),
  fileUrl: z.string().nullable(),
  fileName: z.string().nullable(),
  createdAt: z.string(),
  author: AuthorSchema,
  tags: z.array(TagSchema),
  _count: CountSchema,
});

const PaginationSchema = z.object({
  hasMore: z.boolean(),
  nextCursor: z.union([z.string(), z.number().int()]).nullable().optional(),
});

const PostResponseSchema = z.object({
  data: z.array(PostDataSchema),
  pagination: PaginationSchema,
});

type Post = z.infer<typeof PostDataSchema>;

export { PostDataSchema, PaginationSchema, PostResponseSchema, type Post };
