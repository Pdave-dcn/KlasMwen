import {
  ChatGroupNotFoundError,
  InsufficientChatRoleError,
  NotAMemberError,
} from "../../../core/error/custom/chat.error.js";
import ChatRepository from "../service/ChatRepository.js";

import type { ChatRole } from "@prisma/client";
import type { Request, Response, NextFunction } from "express";

/**
 * Middleware factory that requires a user to be a member of a chat group.
 */
const requireMembership = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id: chatGroupId } = req.params;

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
      throw new NotAMemberError(req.user?.id ?? "#", req.params.id);
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware factory that requires specific chat roles.
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
        return next(
          new InsufficientChatRoleError(
            req.user?.id ?? "#",
            roles,
            req.user?.chatRole
          )
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export { requireMembership, requireChatRole };
