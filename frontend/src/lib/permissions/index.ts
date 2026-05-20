import { createRbac, POLICY, registry, type UserRole } from "@klasmwen/shared";

import type { User } from "./types";

export { POLICY } from "@klasmwen/shared";

const { hasPermission } = createRbac(
  registry,
  POLICY,
  (user: User) => user.role as UserRole | undefined,
);

export { hasPermission };
