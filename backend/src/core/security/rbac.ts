import {
  createRbac,
  createAssert,
  POLICY,
  registry,
  type UserRole,
} from "@klasmwen/shared";

import { AuthorizationError } from "../error/custom/auth.error.js";

type User = Express.User & { role?: UserRole };

const getUserRole = (user: User): UserRole | undefined => user.role;

const { hasPermission } = createRbac(registry, POLICY, getUserRole);

const assertPermission = createAssert(
  hasPermission,
  (user, resource, action) =>
    `User ${user.id} (role: ${user.role}) not permitted to ${action} ${resource}`,
  AuthorizationError,
);

export { hasPermission, assertPermission };
