import { createLogger } from "../core/config/logger.js";
import { handleError } from "../core/error/index";
import CommentService from "../features/comments/service/CommentService.js";
import PostService from "../features/posts/service/PostService.js";
import UserService from "../features/user/service/UserService.js";
import { ensureAuthenticated } from "../utils/auth.util.js";
import createActionLogger from "../utils/logger.util.js";
import {
  createPaginationSchema,
  uuidPaginationSchema,
} from "../utils/pagination.util.js";
import {
  UpdateUserProfileSchema,
  UserIdParamSchema,
} from "../zodSchemas/user.zod.js";

import type { Response, Request } from "express";

const controllerLogger = createLogger({ module: "UserController" });

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

const updateUserProfile = async (req: Request, res: Response) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "updateUserProfile",
    req
  );

  try {
    actionLogger.info("User profile update attempt started");
    const startTime = Date.now();

    actionLogger.debug("Authenticating user");
    const user = ensureAuthenticated(req);

    actionLogger.debug("Validating profile update data");
    const { bio, avatarId } = UpdateUserProfileSchema.parse(req.body);

    actionLogger.info(
      {
        userId: user.id,
        hasBioUpdate: !!bio,
        hasAvatarUpdate: !!avatarId,
        bioLength: bio?.length,
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
        username: updatedUser.username,
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

const getMyPosts = async (req: Request, res: Response) => {
  const actionLogger = createActionLogger(controllerLogger, "getMyPosts", req);

  try {
    actionLogger.info("Fetching user's own posts");
    const startTime = Date.now();

    const user = ensureAuthenticated(req);
    const { limit, cursor } = uuidPaginationSchema.parse(req.query);

    actionLogger.info(
      {
        userId: user.id,
        limit,
        cursor,
        hasCursor: !!cursor,
      },
      "User authenticated and pagination parameters parsed"
    );

    actionLogger.debug("Processing user posts request");
    const serviceStartTime = Date.now();
    const result = await PostService.getUserPosts(
      user.id,
      limit,
      cursor as string | undefined
    );
    const serviceDuration = Date.now() - serviceStartTime;

    const totalDuration = Date.now() - startTime;
    actionLogger.info(
      {
        userId: user.id,
        limit,
        cursor,
        postsCount: result.posts.length,
        hasMore: result.pagination.hasMore,
        nextCursor: result.pagination.nextCursor,
        serviceDuration,
        totalDuration,
      },
      "User posts fetched successfully"
    );

    return res.status(200).json({
      data: result.posts,
      pagination: result.pagination,
    });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

const getPostsLikedByMe = async (req: Request, res: Response) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "getPostsLikedByMe",
    req
  );

  try {
    actionLogger.info("Fetching user liked posts");
    const startTime = Date.now();

    actionLogger.debug("Authenticating user");
    const user = ensureAuthenticated(req);

    actionLogger.debug("Parsing pagination parameters");
    const { limit, cursor } = uuidPaginationSchema.parse(req.query);

    actionLogger.info(
      {
        userId: user.id,
        limit,
        cursor,
        hasCursor: !!cursor,
      },
      "User authenticated and pagination parameters parsed"
    );

    actionLogger.debug("Fetching and processing user liked posts");
    const serviceStartTime = Date.now();
    const result = await PostService.getUserLikedPosts(
      user.id,
      limit,
      cursor as string | undefined
    );
    const serviceDuration = Date.now() - serviceStartTime;

    const totalDuration = Date.now() - startTime;
    actionLogger.info(
      {
        userId: user.id,
        limit,
        cursor,
        likedPostsCount: result.posts.length,
        hasMore: result.pagination.hasMore,
        nextCursor: result.pagination.nextCursor,
        serviceDuration,
        totalDuration,
      },
      "User liked posts fetched successfully"
    );

    return res.status(200).json({
      data: result.posts,
      pagination: result.pagination,
    });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

const getUserPosts = async (req: Request, res: Response) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "getUserPosts",
    req
  );

  try {
    actionLogger.info("Fetching user posts by ID");
    const startTime = Date.now();

    actionLogger.debug("Validating user ID parameter");
    const { id: userId } = UserIdParamSchema.parse(req.params);

    actionLogger.debug("Parsing pagination parameters");
    const { limit, cursor } = uuidPaginationSchema.parse(req.query);

    actionLogger.info(
      {
        requestedUserId: userId,
        limit,
        cursor,
        hasCursor: !!cursor,
      },
      "User ID validated and pagination parameters parsed"
    );

    actionLogger.debug("Verifying user exists");
    await UserService.userExists(userId);

    actionLogger.debug("Processing user posts request");
    const serviceStartTime = Date.now();
    const result = await PostService.getUserPosts(
      userId,
      limit,
      cursor as string | undefined
    );
    const serviceDuration = Date.now() - serviceStartTime;

    const totalDuration = Date.now() - startTime;

    actionLogger.info(
      {
        requestedUserId: userId,
        limit,
        cursor,
        postsCount: result.posts.length,
        hasMore: result.pagination.hasMore,
        nextCursor: result.pagination.nextCursor,
        serviceDuration,
        totalDuration,
      },
      "User posts fetched successfully"
    );

    return res.status(200).json({
      data: result.posts,
      pagination: result.pagination,
    });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

const getUserComments = async (req: Request, res: Response) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "getUserComments",
    req
  );
  try {
    actionLogger.info("Fetching user comments and replies");
    const startTime = Date.now();

    actionLogger.debug("Validating user ID parameter");
    const { id: userId } = UserIdParamSchema.parse(req.params);

    actionLogger.debug("Parsing pagination parameters");
    const customPaginationSchema = createPaginationSchema(10, 50, "number");
    const { limit, cursor } = customPaginationSchema.parse(req.query);

    actionLogger.info(
      {
        requestedUserId: userId,
        limit,
        cursor,
        hasCursor: !!cursor,
      },
      "User ID validated and pagination parameters parsed"
    );

    actionLogger.debug("Verifying user exists");
    await UserService.userExists(userId);

    actionLogger.debug("Processing user comments and replies fetching request");
    const serviceStartTime = Date.now();
    const result = await CommentService.getUserCommentsWithRelations(
      userId,
      limit,
      cursor as string | undefined
    );
    const serviceDuration = Date.now() - serviceStartTime;

    const totalDuration = Date.now() - startTime;

    actionLogger.info(
      {
        requestedUserId: userId,
        limit,
        cursor,
        commentsCount: result.comments.length,
        hasMore: result.pagination.hasMore,
        nextCursor: result.pagination.nextCursor,
        serviceDuration,
        totalDuration,
      },
      "User comments and replies fetched successfully"
    );

    return res.status(200).json({
      data: result.comments,
      pagination: result.pagination,
    });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

const getUserMediaPosts = async (req: Request, res: Response) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "getUserMediaPosts",
    req
  );
  try {
    actionLogger.info("Fetching user media posts");
    const startTime = Date.now();

    actionLogger.debug("Validating user ID parameter");
    const { id: userId } = UserIdParamSchema.parse(req.params);

    actionLogger.debug("Parsing pagination parameters");
    const { limit, cursor } = uuidPaginationSchema.parse(req.query);

    actionLogger.info(
      {
        requestedUserId: userId,
        limit,
        cursor,
        hasCursor: !!cursor,
      },
      "User ID validated and pagination parameters parsed"
    );

    actionLogger.debug("Verifying user exists");
    await UserService.userExists(userId);

    actionLogger.debug("Processing user posts request");
    const serviceStartTime = Date.now();
    const result = await PostService.getUserMediaPosts(
      userId,
      limit,
      cursor as string | undefined
    );
    const serviceDuration = Date.now() - serviceStartTime;

    const totalDuration = Date.now() - startTime;

    actionLogger.info(
      {
        requestedUserId: userId,
        limit,
        cursor,
        postsCount: result.posts.length,
        hasMore: result.pagination.hasMore,
        nextCursor: result.pagination.nextCursor,
        serviceDuration,
        totalDuration,
      },
      "User media posts fetched successfully"
    );

    return res.status(200).json({
      data: result.posts,
      pagination: result.pagination,
    });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

export {
  getUserById,
  updateUserProfile,
  getMyPosts,
  getUserPosts,
  getActiveUser,
  getPostsLikedByMe,
  getUserComments,
  getUserMediaPosts,
};
