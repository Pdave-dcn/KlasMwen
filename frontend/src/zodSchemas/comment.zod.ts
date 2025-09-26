import { z } from "zod";

import { AvatarSchema as BaseAvatarSchema } from "./user.zod";

const BaseAuthorSchema = z
  .object({
    id: z.string(),
    username: z.string(),
    Avatar: BaseAvatarSchema,
  })
  .transform((data) => ({
    id: data.id,
    username: data.username,
    avatar: data.Avatar,
  }));

const BaseCommentSchema = z
  .object({
    id: z.number().int(),
    content: z.string(),
    createdAt: z.string(),
    author: BaseAuthorSchema,
    _count: z.object({
      Comment: z.number().int(),
    }),
  })
  .transform((data) => ({
    id: data.id,
    content: data.content,
    createdAt: data.createdAt,
    author: data.author,
    totalReplies: data._count.Comment,
  }));

const CommentPaginationSchema = z.object({
  hasMore: z.boolean(),
  nextCursor: z.number().int().nullable(),
  totalComments: z.number().int(),
});

const ReplySchema = z.object({
  id: z.number().int(),
  content: z.string(),
  author: BaseAuthorSchema,
  createdAt: z.string(),
});

const ReplyPaginationSchema = z.object({
  hasMore: z.boolean(),
  nextCursor: z.number().int().nullable(),
});

const ParentCommentsResponseSchema = z.object({
  data: z.array(BaseCommentSchema),
  pagination: CommentPaginationSchema,
});

const ReplyResponseSchema = z.object({
  data: z.array(ReplySchema),
  pagination: ReplyPaginationSchema,
});

const AuthorSchema = z.object({
  id: z.string(),
  username: z.string(),
});

const AvatarSchema = z
  .object({
    url: z.url(),
  })
  .nullable();

const CommentAuthorSchema = z.object({
  id: z.string(),
  username: z.string(),
  avatar: AvatarSchema,
});

const PostSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string().nullable(),
  author: AuthorSchema,
});

const ParentCommentSchema = z
  .object({
    id: z.number().int(),
    content: z.string(),
    author: AuthorSchema,
  })
  .nullable();

const CommentSchema = z.object({
  id: z.number().int(),
  content: z.string(),
  createdAt: z.string(),
  author: CommentAuthorSchema,
  post: PostSchema,
  parentComment: ParentCommentSchema,
  isReply: z.boolean(),
});

const PaginationSchema = z.object({
  hasMore: z.boolean(),
  nextCursor: z.number().int().nullable(),
});

const ProfileCommentsResponseSchema = z.object({
  data: z.array(CommentSchema),
  pagination: PaginationSchema,
});

export type ProfileComment = z.infer<typeof CommentSchema>;
export type Comment = z.infer<typeof BaseCommentSchema>;

export {
  CommentSchema,
  CommentAuthorSchema,
  PostSchema,
  ParentCommentSchema,
  AuthorSchema,
  AvatarSchema,
  PaginationSchema,
  ProfileCommentsResponseSchema,
  ParentCommentsResponseSchema,
  ReplyResponseSchema,
};
