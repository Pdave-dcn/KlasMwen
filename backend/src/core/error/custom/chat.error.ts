import BaseCustomError from "./base.error.js";

import type { ChatRole } from "@prisma/client";

/**
 * Thrown when a chat group cannot be found.
 * HTTP 404 - Resource not found
 */
class ChatGroupNotFoundError extends BaseCustomError {
  statusCode = 404;

  constructor(chatGroupId: string) {
    super(`Chat group with ID ${chatGroupId} not found`);
  }
}

/**
 * Thrown when a user is not a member of a chat group.
 * HTTP 403 - Forbidden (user exists but lacks access)
 */
class ChatMemberNotFoundError extends BaseCustomError {
  statusCode = 403;

  constructor(userId: string, chatGroupId: string) {
    super(`User ${userId} is not a member of group ${chatGroupId}`);
  }
}

/**
 * Thrown when user is not a member but membership is required.
 * HTTP 403 - Forbidden (authentication passed but authorization failed)
 */
class NotAMemberError extends BaseCustomError {
  statusCode = 403;

  constructor(userId: string, chatGroupId: string) {
    super(`User ${userId} is not a member of chat group ${chatGroupId}`);
  }
}

/**
 * Thrown when a message cannot be found.
 * HTTP 404 - Resource not found
 */
class MessageNotFoundError extends BaseCustomError {
  statusCode = 404;

  constructor(messageId: number) {
    super(`Message ${messageId} not found`);
  }
}

/**
 * Thrown when attempting to add a user who is already a member.
 * HTTP 409 - Conflict (resource state conflict)
 */
class AlreadyMemberError extends BaseCustomError {
  statusCode = 409;

  constructor(userId: string, chatGroupId: string) {
    super(`User ${userId} is already a member of group ${chatGroupId}`);
  }
}

/**
 * Thrown when user lacks required permissions for an action.
 * HTTP 403 - Forbidden (insufficient privileges)
 */
class InsufficientPermissionsError extends BaseCustomError {
  statusCode = 403;

  constructor(action: string) {
    super(`Insufficient permissions to ${action}`);
  }
}

/**
 * Thrown when user doesn't have the required chat role(s).
 * HTTP 403 - Forbidden (user is a member but lacks required role)
 */
class InsufficientChatRoleError extends BaseCustomError {
  statusCode = 403;

  constructor(userId: string, requiredRoles: ChatRole[], currentRole?: string) {
    const roleStr = requiredRoles.join(" or ");
    const current = currentRole ?? "none";
    super(
      `User ${userId} does not have required role. Required: ${roleStr}, Got: ${current}`,
    );
  }
}

class UserMutedError extends BaseCustomError {
  statusCode = 403;

  constructor(userId: string, chatGroupId: string, mutedUntil: Date) {
    super(
      `User ${userId} is muted in group ${chatGroupId} until ${mutedUntil.toISOString()}`,
    );
  }
}

export {
  ChatGroupNotFoundError,
  ChatMemberNotFoundError,
  NotAMemberError,
  MessageNotFoundError,
  AlreadyMemberError,
  InsufficientPermissionsError,
  InsufficientChatRoleError,
  UserMutedError,
};
