import type { Post, Comment, Notification } from "@prisma/client";

type WithAuthorId<T extends { id: string | number; authorId: string }> = Pick<
  T,
  "id"
> & {
  authorId?: string;
  author?: { id: string };
};

type WithUserId<T extends { id: string | number; userId: string }> = Pick<
  T,
  "id"
> & {
  userId?: string;
  user?: { id: string };
};

type PostForPolicy = WithAuthorId<Post>;
type CommentForPolicy = WithAuthorId<Comment>;
type NotificationForPolicy = WithUserId<Notification>;

const registry = {
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

type Registry = typeof registry;

export { registry, type Registry };
