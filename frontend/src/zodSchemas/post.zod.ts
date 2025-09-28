import { z } from "zod";

import { AvatarSchema } from "./user.zod";

const PostTypeSchema = z.enum(["NOTE", "QUESTION", "RESOURCE"]);

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
  type: PostTypeSchema,
  fileUrl: z.string().nullable(),
  fileName: z.string().nullable(),
  createdAt: z.string(),
  author: AuthorSchema,
  tags: z.array(TagSchema),
  _count: CountSchema,
});

const ExtendedPostDataSchema = PostDataSchema.extend({
  fileSize: z.number().int().nullable(),
  mimeType: z.string().nullable(),
  updatedAt: z.string(),
});

const LessExtendedPostDataSchema = ExtendedPostDataSchema.omit({
  mimeType: true,
  updatedAt: true,
});

const MediaPostDataSchema = PostDataSchema.extend({
  content: z.null(),
  type: z.literal("RESOURCE"),
});

const PaginationSchema = z.object({
  hasMore: z.boolean(),
  nextCursor: z.union([z.string(), z.number().int()]).nullable().optional(),
});

const PostResponseSchema = z.object({
  data: z.array(PostDataSchema),
  pagination: PaginationSchema,
});

const MediaPostResponseSchema = z.object({
  data: z.array(MediaPostDataSchema),
  pagination: PaginationSchema,
});

const SinglePostResponseSchema = z.object({
  data: LessExtendedPostDataSchema,
});

export type Post = z.infer<typeof PostDataSchema>;

export {
  PostTypeSchema,
  PostDataSchema,
  PaginationSchema,
  PostResponseSchema,
  MediaPostResponseSchema,
  AuthorSchema,
  ExtendedPostDataSchema,
  LessExtendedPostDataSchema,
  SinglePostResponseSchema,
};
