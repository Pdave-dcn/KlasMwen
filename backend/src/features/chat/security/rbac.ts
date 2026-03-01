import { AuthorizationError } from "../../../core/error/custom/auth.error.js";

import { CIRCLE_POLICY } from "./policy.js";

import type { CircleRegistry } from "./types.js";
import type { CircleRole } from "@prisma/client";

/**
 * Checks if a user is allowed to do something in a circle.
 *
 * It looks at the user's circle role and checks the CIRCLE_POLICY
 * to see if that role is allowed to perform the action.
 *
 * Some permissions are simple true/false.
 * Others need resource data to decide (for example, checking if the user owns a message).
 *
 * Important:
 * The user object must include circleRole.
 * This is usually added earlier by middleware.
 *
 * @template Res - The resource type (example: "circles", "circleMessages")
 * @param user - The user, including their circleRole
 * @param resource - The resource the user wants to access
 * @param action - The action the user wants to perform (example: "delete", "send")
 * @param data - Optional data used to help decide permission
 *
 * @returns true if the user is allowed, false if not allowed
 *
 * Example:
 * const user = { id: "u1", role: "STUDENT", circleRole: "OWNER" };
 *
 * hasCirclePermission(user, "circles", "delete")
 * // returns true
 *
 * hasCirclePermission(user, "circleMessages", "delete", messageData)
 * // returns true or false depending on the message
 */
const hasCirclePermission = <Res extends keyof CircleRegistry>(
  user: Omit<Express.User, "email"> & { circleRole?: CircleRole },
  resource: Res,
  action: CircleRegistry[Res]["action"][number],
  data?: CircleRegistry[Res]["datatype"],
): boolean => {
  // If the user has no circleRole, they are not allowed
  if (!user.circleRole) return false;

  // Get the permission rule for this role, resource, and action
  const permission = CIRCLE_POLICY[user.circleRole]?.[resource]?.[action];

  // If no rule exists, the action is not allowed
  if (permission === undefined) return false;

  // If the rule is true or false, return it directly
  if (typeof permission === "boolean") return permission;

  // If the rule is a function, use the data to decide
  // If no data is provided, deny access
  return data ? permission(user, data) : false;
};

/**
 * Makes sure a user is allowed to do something in a circle.
 *
 * If the user is NOT allowed, it throws an AuthorizationError.
 * This stops the action immediately.
 *
 * Use this in routes or services where permission is required.
 *
 * Important:
 * The user object must include circleRole.
 *
 * @template Res - The resource type
 * @param user - The user, including their circleRole
 * @param resource - The resource being accessed
 * @param action - The action being performed
 * @param data - Optional data used to help decide permission
 *
 * @throws AuthorizationError if the user is not allowed
 *
 * Example:
 * const user = { id: "u1", role: "STUDENT", circleRole: "MEMBER" };
 *
 * assertCirclePermission(user, "circleMessages", "delete", messageData)
 * // throws error if not allowed
 *
 * assertCirclePermission(user, "circleMessages", "send")
 * // continues if allowed
 */
const assertCirclePermission = <Res extends keyof CircleRegistry>(
  user: Omit<Express.User, "email"> & { circleRole?: CircleRole },
  resource: Res,
  action: CircleRegistry[Res]["action"][number],
  data?: CircleRegistry[Res]["datatype"],
): void => {
  // Check permission
  if (!hasCirclePermission(user, resource, action, data)) {
    // Prepare role info for the error message
    const roleInfo = user.circleRole
      ? ` with role ${user.circleRole}`
      : " (no circle role)";

    // Throw error if not allowed
    throw new AuthorizationError(
      `User ${user.id}${roleInfo} not permitted to ${action} ${resource}`,
    );
  }
};

export { hasCirclePermission, assertCirclePermission };
