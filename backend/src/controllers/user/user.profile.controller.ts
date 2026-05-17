import { createLogger } from "../../core/config/logger.js";
import {
  userCommandService,
  userQueryService,
} from "../../features/user/service/index.js";
import { withLogging } from "../../utils/logger.util.js";
import {
  UpdateUserProfileSchema,
  UserIdParamSchema,
} from "../../zodSchemas/user.zod.js";

import type { AuthenticatedRequest } from "../../types/AuthRequest.js";

const controllerLogger = createLogger({ module: "UserController" });

const getActiveUser = withLogging<AuthenticatedRequest>(
  controllerLogger, "getActiveUser",
  async ({ req, res, log }) => {
    log.info("Active user fetch attempt started");

    const user = await userQueryService.getActiveUser(req.user.id);

    log.info(
      {
        authenticatedUserId: req.user.id,
        username: user.username,
        userRole: user.role,
        hasAvatar: !!user.avatar,
        hasBio: !!user.bio,
      },
      "Active user fetched successfully",
    );

    res.status(200).json({ data: user });
  },
);

const getUserById = withLogging<AuthenticatedRequest>(
  controllerLogger, "getUserById",
  async ({ req, res, log }) => {
    log.info("User fetch by ID attempt started");

    const { id: userId } = UserIdParamSchema.parse(req.params);
    const user = await userQueryService.findUserById(userId);

    log.info(
      {
        requestedUserId: userId,
        foundUsername: user.username,
        userRole: user.role,
        hasAvatar: !!user.avatar,
        hasBio: !!user.bio,
      },
      "User fetched successfully",
    );

    res.status(200).json({ data: user });
  },
);

const updateUserProfile = withLogging<AuthenticatedRequest>(
  controllerLogger, "updateUserProfile",
  async ({ req, res, log }) => {
    log.info("User profile update attempt started");

    const { bio, avatarId } = UpdateUserProfileSchema.parse(req.body);
    const updatedUser = await userCommandService.updateUserProfile(req.user.id, {
      bio,
      avatarId,
    });

    log.info(
      {
        userId: req.user.id,
        updatedBio: !!updatedUser.bio,
        updatedAvatar: !!updatedUser.avatar,
        bioLength: updatedUser.bio?.length,
      },
      "User profile updated successfully",
    );

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  },
);

export { getActiveUser, getUserById, updateUserProfile };
