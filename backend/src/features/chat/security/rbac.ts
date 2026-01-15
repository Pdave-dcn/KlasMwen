import { AuthorizationError } from "../../../core/error/custom/auth.error.js";

import { CHAT_POLICY } from "./policy.js";

import type { ChatRegistry } from "./types.js";
import type { ChatRole } from "@prisma/client";

/**
 * Evaluates whether a user has permission to perform an action on a chat resource.
 *
 * This function checks the CHAT_POLICY for the user's chat role and evaluates
 * permission rules, which can be boolean values or functions that evaluate based
 * on the resource data.
 *
 * **Important**: The user object must have a `chatRole` property populated,
 * typically by middleware that fetches the user's role in the specific chat group.
 *
 * @template Res - The resource type key from the ChatRegistry
 * @param {Express.User & { chatRole?: ChatRole }} user - The user with their chat role
 * @param {Res} resource - The resource type being accessed
 * @param {ChatRegistry[Res]["action"][number]} action - The action being performed
 * @param {ChatRegistry[Res]["datatype"]} [data] - Optional resource data for evaluation
 * @returns {boolean} True if the user has permission, false otherwise
 *
 * @example
 * const user = { id: "u1", role: "STUDENT", chatRole: "OWNER" };
 * hasChatPermission(user, "chatGroups", "delete") // => true
 * hasChatPermission(user, "chatMessages", "delete", messageData) // => true/false
 */
const hasChatPermission = <Res extends keyof ChatRegistry>(
  user: Express.User & { chatRole?: ChatRole },
  resource: Res,
  action: ChatRegistry[Res]["action"][number],
  data?: ChatRegistry[Res]["datatype"]
): boolean => {
  // User must have a chat role to access chat resources
  if (!user.chatRole) return false;

  const permission = CHAT_POLICY[user.chatRole]?.[resource]?.[action];
  if (permission === undefined) return false;
  if (typeof permission === "boolean") return permission;
  return data ? permission(user, data) : false;
};

/**
 * Asserts that a user has permission to perform an action on a chat resource.
 *
 * Throws an AuthorizationError if the user lacks the required permission.
 * Use this function to enforce permissions in chat-related routes or operations.
 *
 * **Important**: The user object must have a `chatRole` property populated,
 * typically by middleware that fetches the user's role in the specific chat group.
 *
 * @template Res - The resource type key from the ChatRegistry
 * @param {Express.User & { chatRole?: ChatRole }} user - The user with their chat role
 * @param {Res} resource - The resource type being accessed
 * @param {ChatRegistry[Res]["action"][number]} action - The action being performed
 * @param {ChatRegistry[Res]["datatype"]} [data] - Optional resource data for evaluation
 * @throws {AuthorizationError} When the user lacks permission for the specified action
 * @returns {void}
 *
 * @example
 * const user = { id: "u1", role: "STUDENT", chatRole: "MEMBER" };
 * assertChatPermission(user, "chatMessages", "delete", messageData) // may throw
 * assertChatPermission(user, "chatMessages", "send") // passes if member
 */
const assertChatPermission = <Res extends keyof ChatRegistry>(
  user: Express.User & { chatRole?: ChatRole },
  resource: Res,
  action: ChatRegistry[Res]["action"][number],
  data?: ChatRegistry[Res]["datatype"]
): void => {
  if (!hasChatPermission(user, resource, action, data)) {
    const roleInfo = user.chatRole
      ? ` with role ${user.chatRole}`
      : " (no chat role)";
    throw new AuthorizationError(
      `User ${user.id}${roleInfo} not permitted to ${action} ${resource}`
    );
  }
};

export { hasChatPermission, assertChatPermission };
