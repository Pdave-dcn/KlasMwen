import {
  createRbac,
  createAssert,
  circleRegistry,
  CIRCLE_POLICY,
  type CircleRole,
} from "@klasmwen/shared";

import { AuthorizationError } from "../../../core/error/custom/auth.error.js";

type CircleUser = Omit<Express.User, "email"> & { circleRole?: CircleRole };

const getCircleRole = (user: CircleUser): CircleRole | undefined =>
  user.circleRole;

const { hasPermission: hasCirclePermission } = createRbac(
  circleRegistry,
  CIRCLE_POLICY,
  getCircleRole,
);

const assertCirclePermission = createAssert(
  hasCirclePermission,
  (user, resource, action) => {
    const roleInfo = user.circleRole
      ? ` with role ${user.circleRole}`
      : " (no circle role)";
    return `User ${user.id}${roleInfo} not permitted to ${action} ${resource}`;
  },
  AuthorizationError,
);

export { hasCirclePermission, assertCirclePermission };
