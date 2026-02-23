import {
  ChatGroupNotFoundError,
  NotAMemberError,
} from "../../../core/error/custom/chat.error.js";
import { StudyCircleIdParamSchema } from "../../../zodSchemas/chat.zod.js";
import ChatRepository from "../service/Repositories/ChatRepository.js";

import type { Request, Response, NextFunction } from "express";

/**
 * Middleware that adds the user's role in a study circle to req.user.
 *
 * What this middleware does:
 * - Gets the circleId from req.params
 * - Checks if the study circle exists
 * - Checks if the user is a member of the study circle
 * - Adds the user's role to req.user.chatRole
 *
 * Note: This must run after the authentication middleware,
 * because it needs req.user to already exist.
 *
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 *
 * @throws {ChatGroupNotFoundError} If the study circle does not exist
 *
 * @example
 * router.delete(
 *   "/:circleId",
 *   requireAuth,
 *   enrichChatRole,
 *   async (req, res) => {
 *     // req.user.chatRole is now available
 *     await ChatService.deleteGroup(req.params.circleId, req.user);
 *   }
 * );
 */
const enrichChatRole = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = StudyCircleIdParamSchema.safeParse(req.params);

    if (!result.success) {
      return next();
    }

    // Verify study circle exists
    const circle = await ChatRepository.findGroupById(result.data.circleId);
    if (!circle) {
      throw new ChatGroupNotFoundError(result.data.circleId);
    }

    // Get user's membership and role
    if (req.user) {
      const membership = await ChatRepository.getMembership(
        req.user.id,
        result.data.circleId,
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
 * Middleware that makes sure the user is a member of a study circle.
 *
 * What this middleware does:
 * - Checks if the study circle exists
 * - Checks if the user is a member of the study circle
 * - Saves the user's role in req.user.chatRole
 * - Throws an error if the user is not a member
 *
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 *
 * @throws {ChatGroupNotFoundError} If the chat group does not exist
 * @throws {NotAMemberError} If the user is not a member of the group
 *
 * @example
 * router.get(
 *   "/:chatGroupId/messages",
 *   requireAuth,
 *   requireMembership,
 *   async (req, res) => {
 *     // User is confirmed to be a member
 *     const messages = await ChatService.getMessages(
 *       req.params.circleId,
 *       req.user
 *     );
 *     res.json(messages);
 *   }
 * );
 */
const requireMembership = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = StudyCircleIdParamSchema.safeParse(req.params);

    if (!result.success) {
      return next();
    }

    // Verify study circle exists
    const circle = await ChatRepository.findGroupById(result.data.circleId);
    if (!circle) {
      throw new ChatGroupNotFoundError(result.data.circleId);
    }

    // Get user's membership and role
    if (req.user) {
      const membership = await ChatRepository.getMembership(
        req.user.id,
        result.data.circleId,
      );

      req.user.chatRole = membership?.role ?? undefined;
    }

    // Check if user has a chat role (is a member)
    if (!req.user?.chatRole) {
      throw new NotAMemberError(
        req.user?.id ?? "unknown",
        result.data.circleId,
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

export { enrichChatRole, requireMembership };
