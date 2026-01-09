import { z } from "zod";

import { PostTypeSchema } from "./post.zod";

const NotificationTypeEnum = z.enum([
  "COMMENT_ON_POST",
  "REPLY_TO_COMMENT",
  "LIKE",
  "REPORT_UPDATE",
]);

const NotificationSchema = z.object({
  id: z.number().int().positive(),
  type: NotificationTypeEnum,
  read: z.boolean(),
  createdAt: z.string(),
  userId: z.uuid(),
  actorId: z.uuid(),
  postId: z.uuid().nullable(),
  commentId: z.number().int().positive().nullable(),
});

const SocketNotificationSchema = z.object({
  id: z.number().int().positive(),
  type: NotificationTypeEnum,
  userId: z.uuid(),
});

const ActorSchema = z.object({
  id: z.uuid(),
  username: z.string(),
  Avatar: z.object({
    url: z.url(),
  }),
});

const PostSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  type: PostTypeSchema,
});

const CommentSchema = z.object({
  id: z.number().int().positive(),
  content: z.string(),
  postId: z.uuid(),
});

const NotificationWithRelationsSchema = NotificationSchema.extend({
  actor: ActorSchema,
  post: PostSchema.nullish(),
  comment: CommentSchema.nullish(),
});

const PaginationSchema = z.object({
  hasMore: z.boolean(),
  nextCursor: z.number().int().positive().nullish(),
});

const NotificationsResponseSchema = z.object({
  data: z.array(NotificationWithRelationsSchema),
  pagination: PaginationSchema,
  unreadCount: z.number().int().nonnegative(),
});

const NotificationsQueryParamsSchema = z.object({
  type: NotificationTypeEnum.optional(),
  read: z.boolean().optional(),
  limit: z.number().int().positive().optional(),
  cursor: z.number().int().positive().optional(),
});

const NotificationsQueryFiltersSchema = NotificationsQueryParamsSchema.omit({
  limit: true,
  cursor: true,
});

export type NotificationType = z.infer<typeof NotificationTypeEnum>;
export type Notification = z.infer<typeof NotificationSchema>;
export type SocketNotification = z.infer<typeof SocketNotificationSchema>;
export type NotificationWithRelations = z.infer<
  typeof NotificationWithRelationsSchema
>;
export type NotificationsResponse = z.infer<typeof NotificationsResponseSchema>;
export type NotificationParams = z.infer<typeof NotificationsQueryParamsSchema>;
export type NotificationFilters = z.infer<
  typeof NotificationsQueryFiltersSchema
>;

export {
  NotificationSchema,
  SocketNotificationSchema,
  NotificationWithRelationsSchema,
  NotificationsResponseSchema,
  NotificationsQueryParamsSchema,
  NotificationsQueryFiltersSchema,
};
