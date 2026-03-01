import {
  CircleNotFoundError,
  NotAMemberError,
} from "../../../core/error/custom/circle.error.js";
import { StudyCircleIdParamSchema } from "../../../zodSchemas/circle.zod.js";
import CircleRepository from "../service/Repositories/CircleRepository.js";

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
 * @throws {CircleNotFoundError} If the study circle does not exist
 *
 * @example
 * router.delete(
 *   "/:circleId",
 *   requireAuth,
 *   enrichCircleRole,
 *   async (req, res) => {
 *     // req.user.circleRole is now available
 *     await CircleService.deleteGroup(req.params.circleId, req.user);
 *   }
 * );
 */
const enrichCircleRole = async (
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
    const circle = await CircleRepository.findCircleById(result.data.circleId);
    if (!circle) {
      throw new CircleNotFoundError(result.data.circleId);
    }

    // Get user's membership and role
    if (req.user) {
      const membership = await CircleRepository.getMembership(
        req.user.id,
        result.data.circleId,
      );

      // Attach circle role to user object (can be undefined if not a member)
      req.user.circleRole = membership?.role ?? undefined;
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
 * @throws {CircleNotFoundError} If the study circle does not exist
 * @throws {NotAMemberError} If the user is not a member of the study circle
 *
 * @example
 * router.get(
 *   "/:circleId/messages",
 *   requireAuth,
 *   requireMembership,
 *   async (req, res) => {
 *     // User is confirmed to be a member
 *     const messages = await CircleService.getMessages(
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
    const circle = await CircleRepository.findCircleById(result.data.circleId);
    if (!circle) {
      throw new CircleNotFoundError(result.data.circleId);
    }

    // Get user's membership and role
    if (req.user) {
      const membership = await CircleRepository.getMembership(
        req.user.id,
        result.data.circleId,
      );

      req.user.circleRole = membership?.role ?? undefined;
    }

    // Check if user has a circle role (is a member)
    if (!req.user?.circleRole) {
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

export { enrichCircleRole, requireMembership };
