import type { RoleSchema } from "@/zodSchemas/user.zod";

import type { z } from "zod";

export type Role = z.infer<typeof RoleSchema>;

export type User = {
  id: string;
  role: Role;
};

export {
  registry,
  type Registry,
  type PostForPolicy,
  type CommentForPolicy,
  type WithAuthorId,
} from "@klasmwen/shared";
