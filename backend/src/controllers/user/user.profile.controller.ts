import { createLogger } from "../../core/config/logger.js";
import { handleError } from "../../core/error/index.js";
import UserService from "../../features/user/service/UserService.js";
import { ensureAuthenticated } from "../../utils/auth.util.js";
import createActionLogger from "../../utils/logger.util.js";
import {
  UpdateUserProfileSchema,
  UserIdParamSchema,
} from "../../zodSchemas/user.zod.js";

import type { Request, Response } from "express";

const controllerLogger = createLogger({ module: "UserController" });

const getActiveUser = async (req: Request, res: Response) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "getActiveUser",
    req
  );

  try {
    actionLogger.info("Active user fetch attempt started");
    const startTime = Date.now();

    const validUser = ensureAuthenticated(req);
    actionLogger.info(
      { userId: validUser.id },
      "User authenticated successfully"
    );

    actionLogger.debug("Fetching active user from database ");
    const serviceStartTime = Date.now();
    const user = await UserService.getActiveUser(validUser.id);
    const serviceDuration = Date.now() - serviceStartTime;

    const totalDuration = Date.now() - startTime;
    actionLogger.info(
      {
        authenticatedUserId: validUser.id,
        username: user.username,
        userRole: user.role,
        hasAvatar: !!user.avatar,
        hasBio: !!user.bio,
        serviceDuration,
        totalDuration,
      },
      "Active user fetched successfully"
    );

    return res.status(200).json({
      data: user,
    });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

const getUserById = async (req: Request, res: Response) => {
  const actionLogger = createActionLogger(controllerLogger, "getUserById", req);

  try {
    actionLogger.info("User fetch by ID attempt started");
    const startTime = Date.now();

    const { id: userId } = UserIdParamSchema.parse(req.params);
    actionLogger.info(
      {
        requestedUserId: userId,
      },
      "User ID parameter validated"
    );

    actionLogger.debug("Fetching user from database");
    const serviceStartTime = Date.now();
    const user = await UserService.findUserById(userId);
    const serviceDuration = Date.now() - serviceStartTime;

    const totalDuration = Date.now() - startTime;
    actionLogger.info(
      {
        requestedUserId: userId,
        foundUsername: user.username,
        userRole: user.role,
        hasAvatar: !!user.avatar,
        hasBio: !!user.bio,
        serviceDuration,
        totalDuration,
      },
      "User fetched successfully"
    );

    return res.status(200).json({
      data: user,
    });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

const updateUserProfile = async (req: Request, res: Response) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "updateUserProfile",
    req
  );

  try {
    actionLogger.info("User profile update attempt started");
    const startTime = Date.now();

    const user = ensureAuthenticated(req);
    const { bio, avatarId } = UpdateUserProfileSchema.parse(req.body);
    actionLogger.info(
      {
        userId: user.id,
        hasBioUpdate: !!bio,
        hasAvatarUpdate: !!avatarId,
      },
      "User authenticated and profile data validated"
    );

    actionLogger.debug("Processing user profile update");
    const serviceStartTime = Date.now();
    const updatedUser = await UserService.updateUserProfile(user.id, {
      bio,
      avatarId,
    });
    const serviceDuration = Date.now() - serviceStartTime;

    const totalDuration = Date.now() - startTime;
    actionLogger.info(
      {
        userId: user.id,
        updatedBio: !!updatedUser.bio,
        updatedAvatar: !!updatedUser.avatar,
        bioLength: updatedUser.bio?.length,
        serviceDuration,
        totalDuration,
      },
      "User profile updated successfully"
    );

    return res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

export { getActiveUser, getUserById, updateUserProfile };
