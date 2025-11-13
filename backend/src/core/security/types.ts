import type { Post, Comment } from "@prisma/client";

type WithAuthorId<T extends { id: string | number; authorId: string }> = Pick<
  T,
  "id"
> & {
  authorId?: string;
  author?: { id: string };
};

type PostForPolicy = WithAuthorId<Post>;
type CommentForPolicy = WithAuthorId<Comment>;

const registry = {
  posts: {
    datatype: {} as PostForPolicy,
    action: ["create", "read", "update", "delete", "report"],
  },
  comments: {
    datatype: {} as CommentForPolicy,
    action: ["create", "read", "update", "delete", "report"],
  },
} as const;

type Registry = typeof registry;

export { registry, type Registry };
