import {
  createRbac,
  createAssert,
  CIRCLE_POLICY,
  circleRegistry,
  type CircleRegistry,
  type CircleForPolicy,
  type CircleMemberForPolicy,
  type CircleMessageForPolicy,
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

const assert = createAssert(
  hasCirclePermission,
  (user, resource, action) => {
    const roleInfo = user.circleRole
      ? ` with role ${user.circleRole}`
      : " (no circle role)";
    return `User ${user.id}${roleInfo} not permitted to ${action} ${resource}`;
  },
  AuthorizationError,
);

class CirclePermissionService {
  assertCanUpdateCircle(user: CircleUser, circle: CircleForPolicy): void {
    assert(user, "circles", "update", circle);
  }

  assertCanDeleteCircle(user: CircleUser, circle: CircleForPolicy): void {
    assert(user, "circles", "delete", circle);
  }

  assertCanRemoveMember(
    actor: CircleUser,
    target: CircleMemberForPolicy,
  ): void {
    assert(actor, "circleMembers", "remove", target);
  }

  assertCanMuteMember(actor: CircleUser, target: CircleMemberForPolicy): void {
    assert(actor, "circleMembers", "mute", target);
  }

  assertCanUpdateMemberRole(
    actor: CircleUser,
    target: CircleMemberForPolicy,
  ): void {
    assert(actor, "circleMembers", "updateRole", target);
  }

  assertCanDeleteMessage(
    user: CircleUser,
    message: CircleMessageForPolicy,
  ): void {
    assert(user, "circleMessages", "delete", message);
  }

  assertCan<Res extends keyof CircleRegistry>(
    user: CircleUser,
    resource: Res,
    action: CircleRegistry[Res]["action"][number],
  ): void {
    assert(user, resource, action);
  }
}

const circlePermissionService = new CirclePermissionService();
export { CirclePermissionService, circlePermissionService };
