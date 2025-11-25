import { AuthorizationError } from "../error/custom/auth.error.js";

import { POLICY } from "./policy.js";

import type { Registry } from "./types.js";

/**
 * Evaluates whether a user has permission to perform an action on a resource.
 *
 * Checks the policy registry for the user's role and evaluates permission rules,
 * which can be boolean values or functions that evaluate based on the resource data.
 *
 * @template Res - The resource type key from the Registry
 * @param {Express.User} user - The user attempting the action
 * @param {Res} resource - The resource type being accessed
 * @param {Registry[Res]["action"][number]} action - The action being performed on the resource
 * @param {Registry[Res]["datatype"]} [data] - Optional resource data for dynamic permission evaluation
 * @returns {boolean} True if the user has permission, false otherwise
 *
 * @example
 * hasPermission(user, "post", "create") // => true/false
 * hasPermission(user, "post", "update", postData) // => true/false (evaluated with data)
 */
const hasPermission = <Res extends keyof Registry>(
  user: Express.User,
  resource: Res,
  action: Registry[Res]["action"][number],
  data?: Registry[Res]["datatype"]
): boolean => {
  const permission = POLICY[user.role]?.[resource]?.[action];
  if (permission === undefined) return false;
  if (typeof permission === "boolean") return permission;
  return data ? permission(user, data) : false;
};

/**
 * Asserts that a user has permission to perform an action on a resource.
 *
 * Throws an AuthorizationError if the user lacks the required permission.
 * Use this function to enforce permissions in protected routes or operations.
 *
 * @template Res - The resource type key from the Registry
 * @param {Express.User} user - The user attempting the action
 * @param {Res} resource - The resource type being accessed
 * @param {Registry[Res]["action"][number]} action - The action being performed on the resource
 * @param {Registry[Res]["datatype"]} [data] - Optional resource data for dynamic permission evaluation
 * @throws {AuthorizationError} When the user lacks permission for the specified action
 * @returns {void}
 *
 * @example
 * assertPermission(user, "post", "delete", postData) // throws if unauthorized
 * assertPermission(admin, "user", "ban") // passes if authorized
 */
const assertPermission = <Res extends keyof Registry>(
  user: Express.User,
  resource: Res,
  action: Registry[Res]["action"][number],
  data?: Registry[Res]["datatype"]
): void => {
  if (!hasPermission(user, resource, action, data)) {
    throw new AuthorizationError(
      `User ${user.id} not permitted to ${action} ${resource}`
    );
  }
};

export { hasPermission, assertPermission };
