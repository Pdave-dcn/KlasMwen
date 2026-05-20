import {
  createRbac,
  createAssert,
  POLICY,
  registry,
  type Registry,
  type PostForPolicy,
  type NotificationForPolicy,
  type WithAuthorId,
} from "@klasmwen/shared";

import { AuthorizationError } from "../error/custom/auth.error.js";

type User = Express.User;

const getUserRole = (user: User) => user.role as "ADMIN" | "MODERATOR" | "STUDENT" | undefined;

const { hasPermission } = createRbac(registry, POLICY, getUserRole);

const assert = createAssert(
  hasPermission,
  (user, resource, action) =>
    `User ${user.id} (role: ${user.role}) not permitted to ${action} ${resource}`,
  AuthorizationError,
);

class PermissionService {
  assertCanDeletePost(user: User, post: PostForPolicy): void {
    assert(user, "posts", "delete", post);
  }

  assertCanUpdatePost(user: User, post: PostForPolicy): void {
    assert(user, "posts", "update", post);
  }

  assertCanDeleteComment(user: User, comment: WithAuthorId): void {
    assert(user, "comments", "delete", comment);
  }

  assertCanDeleteNotification(user: User, notification: NotificationForPolicy): void {
    assert(user, "notifications", "delete", notification);
  }

  assertCanUpdateNotification(user: User, notification: NotificationForPolicy): void {
    assert(user, "notifications", "update", notification);
  }

  assertCanReport(
    user: User,
    resource: WithAuthorId,
    type: "posts" | "comments",
  ): void {
    assert(user, type, "report", resource);
  }

  assertCan<Res extends keyof Registry>(
    user: User,
    resource: Res,
    action: Registry[Res]["action"][number],
  ): void {
    assert(user, resource, action);
  }
}

const permissionService = new PermissionService();
export { PermissionService, permissionService };
