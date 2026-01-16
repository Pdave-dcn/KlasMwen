import {
  ChatGroupNotFoundError,
  InsufficientChatRoleError,
  NotAMemberError,
} from "../../../core/error/custom/chat.error.js";
import ChatRepository from "../service/ChatRepository.js";

import type { ChatRole } from "@prisma/client";
import type { Request, Response, NextFunction } from "express";

/**
 * Middleware that enriches the user object with their role in a specific chat group.
 *
 * This middleware:
 * 1. Extracts the chatGroupId from request params
 * 2. Fetches the user's membership in that group
 * 3. Attaches the user's chat role to req.user.chatRole
 *
 * **Important**: This must run after authentication middleware that populates req.user
 *
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * @throws {ChatGroupNotFoundError} If the chat group doesn't exist
 *
 * @example
 * router.delete(
 *   "/:chatGroupId",
 *   requireAuth,
 *   enrichChatRole,
 *   async (req, res) => {
 *     // req.user.chatRole is now available (OWNER, MODERATOR, or MEMBER)
 *     await ChatService.deleteGroup(req.params.chatGroupId, req.user);
 *   }
 * );
 */
const enrichChatRole = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { chatGroupId } = req.params;

    if (!chatGroupId) {
      return next();
    }

    // Verify group exists
    const group = await ChatRepository.findGroupById(chatGroupId);
    if (!group) {
      throw new ChatGroupNotFoundError(chatGroupId);
    }

    // Get user's membership and role
    if (req.user) {
      const membership = await ChatRepository.getMembership(
        req.user.id,
        chatGroupId
      );

      // Attach chat role to user object (can be undefined if not a member)
      req.user.chatRole = membership?.role ?? undefined;
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware that requires a user to be a member of a chat group.
 *
 * This is a convenience middleware that ensures the user is a member with any role.
 * It enriches the user with chatRole and throws an error if they're not a member.
 *
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * @throws {ChatGroupNotFoundError} If the chat group doesn't exist
 * @throws {NotAMemberError} If the user is not a member
 *
 * @example
 * router.get(
 *   "/:chatGroupId/messages",
 *   requireAuth,
 *   requireMembership,
 *   async (req, res) => {
 *     // User is guaranteed to be a member with req.user.chatRole set
 *     const messages = await ChatService.getMessages(
 *       req.params.chatGroupId,
 *       req.user
 *     );
 *     res.json(messages);
 *   }
 * );
 */
const requireMembership = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { chatGroupId } = req.params;

    if (!chatGroupId) {
      return next();
    }

    // Verify group exists
    const group = await ChatRepository.findGroupById(chatGroupId);
    if (!group) {
      throw new ChatGroupNotFoundError(chatGroupId);
    }

    // Get user's membership and role
    if (req.user) {
      const membership = await ChatRepository.getMembership(
        req.user.id,
        chatGroupId
      );

      req.user.chatRole = membership?.role ?? undefined;
    }

    // Check if user has a chat role (is a member)
    if (!req.user?.chatRole) {
      throw new NotAMemberError(req.user?.id ?? "unknown", chatGroupId);
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware factory that requires specific chat roles.
 *
 * @param {ChatRole[]} roles - Array of acceptable chat roles
 * @returns {Function} Express middleware function
 *
 * @example
 * router.put(
 *   "/:chatGroupId/settings",
 *   requireAuth,
 *   requireChatRole(["OWNER", "MODERATOR"]),
 *   async (req, res) => {
 *     // Only owners and moderators can access this route
 *     await ChatService.updateGroup(
 *       req.params.chatGroupId,
 *       req.user,
 *       req.body
 *     );
 *     res.json({ success: true });
 *   }
 * );
 */
const requireChatRole = (roles: ChatRole[]) => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { chatGroupId } = req.params;

      if (!chatGroupId) {
        return next();
      }

      // Verify group exists
      const group = await ChatRepository.findGroupById(chatGroupId);
      if (!group) {
        throw new ChatGroupNotFoundError(chatGroupId);
      }

      // Get user's membership and role
      if (req.user) {
        const membership = await ChatRepository.getMembership(
          req.user.id,
          chatGroupId
        );

        req.user.chatRole = membership?.role ?? undefined;
      }

      // Check if user has required role
      if (!req.user?.chatRole || !roles.includes(req.user.chatRole)) {
        throw new InsufficientChatRoleError(
          req.user?.id ?? "unknown",
          roles,
          req.user?.chatRole
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export { enrichChatRole, requireMembership, requireChatRole };
