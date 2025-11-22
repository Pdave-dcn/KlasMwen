import { createLogger } from "../../core/config/logger";
import { handleError } from "../../core/error";
import CommentService from "../../features/comments/service/CommentService";
import PostService from "../../features/posts/service/PostService";
import UserService from "../../features/user/service/UserService";
import { ensureAuthenticated } from "../../utils/auth.util";
import createActionLogger from "../../utils/logger.util";
import {
  createPaginationSchema,
  uuidPaginationSchema,
} from "../../utils/pagination.util";
import { UserIdParamSchema } from "../../zodSchemas/user.zod";

import type { Request, Response } from "express";

const controllerLogger = createLogger({ module: "UserController" });

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

    const user = ensureAuthenticated(req);
    const { limit, cursor } = uuidPaginationSchema.parse(req.query);
    actionLogger.info(
      {
        userId: user.id,
        limit,
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

    const { id: userId } = UserIdParamSchema.parse(req.params);
    const { limit, cursor } = uuidPaginationSchema.parse(req.query);
    actionLogger.info(
      {
        requestedUserId: userId,
        limit,
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

    const { id: userId } = UserIdParamSchema.parse(req.params);
    const customPaginationSchema = createPaginationSchema(10, 50, "number");
    const { limit, cursor } = customPaginationSchema.parse(req.query);

    actionLogger.info(
      {
        requestedUserId: userId,
        limit,
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

    const { id: userId } = UserIdParamSchema.parse(req.params);
    const { limit, cursor } = uuidPaginationSchema.parse(req.query);

    actionLogger.info(
      {
        requestedUserId: userId,
        limit,
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
  getMyPosts,
  getPostsLikedByMe,
  getUserPosts,
  getUserMediaPosts,
  getUserComments,
};
