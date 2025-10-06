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
  isBookmarked: z.boolean().default(false),
});

const ExtendedPostDataSchema = PostDataSchema.extend({
  fileSize: z.number().int().nullable(),
  mimeType: z.string().nullable(),
  updatedAt: z.string(),
});

const LessExtendedPostDataSchema = ExtendedPostDataSchema.omit({
  mimeType: true,
  updatedAt: true,
  isBookmarked: true,
});

const MediaPostDataSchema = PostDataSchema.extend({
  content: z.null(),
  type: z.literal("RESOURCE"),
});

const allowedMimes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "image/jpeg",
  "image/png",
  "image/webp",
];

const BasePostCreationSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Title must be at least 5 characters")
    .max(100, "Title must be less than 100 characters"),
  type: z.enum(Object.values(PostTypeSchema) as [string, ...string[]]),
  tagIds: z.array(z.number().int().positive()).max(10).nullish(),
});

const TextPostCreationSchema = BasePostCreationSchema.extend({
  type: z.enum(["QUESTION", "NOTE"]),
  content: z
    .string()
    .trim()
    .min(10, "The content must be at least 10 characters")
    .max(10000, "The content must be less than 10000 characters"),
});

const ResourcePostCreationSchema = BasePostCreationSchema.extend({
  type: z.literal("RESOURCE"),
  resource: z
    .custom<FileList>()
    .refine((files) => files && files.length > 0, "You must select a file")
    .refine(
      (files) => !files || files[0].size <= 10 * 1024 * 1024,
      "File must be 10MB or less"
    )
    .refine(
      (files) => !files || allowedMimes.includes(files[0].type),
      "Unsupported file type"
    ),
});

const PostCreationSchema = z.discriminatedUnion("type", [
  TextPostCreationSchema,
  ResourcePostCreationSchema,
]);

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

const CreatedPostResponseSchema = z.object({
  message: z.string(),
  data: ExtendedPostDataSchema.omit({ updatedAt: true, _count: true }),
});

const DeletePostResponseSchema = z.object({
  message: z.string(),
});

export type Post = z.infer<typeof PostDataSchema>;
export type PostType = z.infer<typeof PostTypeSchema>;
export type PostResponse = z.infer<typeof PostResponseSchema>;
export type PostFormValues = z.infer<typeof PostCreationSchema>;
export type TextPostData = z.infer<typeof TextPostCreationSchema>;
export type ResourcePostData = z.infer<typeof ResourcePostCreationSchema>;

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
  TextPostCreationSchema,
  ResourcePostCreationSchema,
  PostCreationSchema,
  CreatedPostResponseSchema,
  DeletePostResponseSchema,
};
