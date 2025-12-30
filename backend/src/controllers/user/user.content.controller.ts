import { createLogger } from "../../core/config/logger.js";
import CommentService from "../../features/comments/service/CommentService.js";
import PostService from "../../features/posts/service/PostService.js";
import UserService from "../../features/user/service/UserService.js";
import createActionLogger from "../../utils/logger.util.js";
import {
  createPaginationSchema,
  uuidPaginationSchema,
} from "../../utils/pagination.util.js";
import { UserIdParamSchema } from "../../zodSchemas/user.zod.js";

import type { AuthenticatedRequest } from "../../types/AuthRequest.js";
import type { Request, Response, NextFunction} from "express";

const controllerLogger = createLogger({ module: "UserController" });

const getMyPosts = async (req: Request, res: Response, next: NextFunction) => {
  const actionLogger = createActionLogger(controllerLogger, "getMyPosts", req);

  try {
    actionLogger.info("Fetching user's own posts");
    const startTime = Date.now();

    const { user } = req as AuthenticatedRequest;

    const { limit, cursor } = uuidPaginationSchema.parse(req.query);

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
    return next(error);
  }
};

const getPostsLikedByMe = async (req: Request, res: Response, next: NextFunction) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "getPostsLikedByMe",
    req
  );

  try {
    actionLogger.info("Fetching user liked posts");
    const startTime = Date.now();

    const { user } = req as AuthenticatedRequest;
    const { limit, cursor } = uuidPaginationSchema.parse(req.query);

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
    return next(error);
  }
};

const getUserPosts = async (req: Request, res: Response, next: NextFunction) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "getUserPosts",
    req
  );

  try {
    actionLogger.info("Fetching user posts by ID");
    const startTime = Date.now();

    const { id: userId } = UserIdParamSchema.parse(req.params);
    const { limit, cursor } = uuidPaginationSchema.parse(req.query);

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
    return next(error);
  }
};

const getUserComments = async (req: Request, res: Response, next: NextFunction) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "getUserComments",
    req
  );
  try {
    actionLogger.info("Fetching user comments and replies");
    const startTime = Date.now();

    const { id: userId } = UserIdParamSchema.parse(req.params);
    const customPaginationSchema = createPaginationSchema(10, 50, "number");
    const { limit, cursor } = customPaginationSchema.parse(req.query);

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
    return next(error);
  }
};

const getUserMediaPosts = async (req: Request, res: Response, next: NextFunction) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "getUserMediaPosts",
    req
  );
  try {
    actionLogger.info("Fetching user media posts");
    const startTime = Date.now();

    const { id: userId } = UserIdParamSchema.parse(req.params);
    const { limit, cursor } = uuidPaginationSchema.parse(req.query);

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
    return next(error);
  }
};

export {
  getMyPosts,
  getPostsLikedByMe,
  getUserPosts,
  getUserMediaPosts,
  getUserComments,
};
