import { Prisma, type NotificationType } from "@prisma/client";

const NotificationFragments = {
  actor: {
    select: {
      id: true,
      username: true,
      Avatar: {
        select: {
          url: true,
        },
      },
    },
  },

  post: {
    select: {
      id: true,
      title: true,
      type: true,
    },
  },

  comment: {
    select: {
      id: true,
      content: true,
      postId: true,
    },
  },
} as const;

// Base selectors for different query types
const BaseSelectors = {
  notification: {
    id: true,
    type: true,
    read: true,
    createdAt: true,
    userId: true,
    actorId: true,
    postId: true,
    commentId: true,
    actor: NotificationFragments.actor,
    post: NotificationFragments.post,
    comment: NotificationFragments.comment,
  } satisfies Prisma.NotificationSelect,
} as const;

// Prisma type validators
const notificationWithRelations =
  Prisma.validator<Prisma.NotificationFindManyArgs>()({
    select: BaseSelectors.notification,
  });

type NotificationWithRelations = Prisma.NotificationGetPayload<
  typeof notificationWithRelations
>;

// DTOs and interfaces
interface CreateNotificationData {
  type: NotificationType;
  userId: string;
  actorId: string;
  postId?: string;
  commentId?: number;
}

interface NotificationFilters {
  userId: string;
  read?: boolean;
  type?: NotificationType;
}

interface NotificationPaginationResult<T> {
  data: T[];
  pagination: {
    nextCursor: number | null;
    hasMore: boolean;
  };
  unreadCount: number;
}

export {
  NotificationFragments,
  BaseSelectors,
  notificationWithRelations,
  NotificationWithRelations,
  CreateNotificationData,
  NotificationFilters,
  NotificationPaginationResult,
};
