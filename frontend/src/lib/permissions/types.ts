import type { Comment as FullComment } from "@/zodSchemas/comment.zod";
import type { Post as FullPost } from "@/zodSchemas/post.zod";
import type { RoleSchema } from "@/zodSchemas/user.zod";

import type { z } from "zod";

export type Role = z.infer<typeof RoleSchema>;

export type User = {
  id: string;
  role: Role;
};

export type PostForPolicy = Pick<FullPost, "id" | "author">;
export type CommentForPolicy = Pick<FullComment, "id" | "author">;

export const registry = {
  posts: {
    datatype: {} as PostForPolicy,
    action: ["create", "read", "update", "delete"],
  },
  comments: {
    datatype: {} as CommentForPolicy,
    action: ["create", "read", "update", "delete"],
  },
} as const;
