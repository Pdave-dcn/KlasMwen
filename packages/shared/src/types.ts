export type UserRole = "ADMIN" | "MODERATOR" | "STUDENT";

export type WithAuthorId = {
  id: string | number;
  authorId?: string;
  author?: { id: string };
};

export type WithUserId = {
  id: string | number;
  userId?: string;
  user?: { id: string };
};

export type PostForPolicy = WithAuthorId;
export type CommentForPolicy = WithAuthorId;
export type NotificationForPolicy = WithUserId;

export const registry = {
  posts: {
    datatype: {} as PostForPolicy,
    action: ["create", "read", "update", "delete", "report"],
  },
  comments: {
    datatype: {} as CommentForPolicy,
    action: ["create", "read", "update", "delete", "report"],
  },
  notifications: {
    datatype: {} as NotificationForPolicy,
    action: ["read", "update", "delete"],
  },
} as const;

export type Registry = typeof registry;
