import { createLogger } from "../../core/config/logger.js";
import CommentService from "../../features/comments/service/CommentService.js";
import { postService } from "../../features/posts/service/PostService.js";
import { userQueryService } from "../../features/user/service/index.js";
import { withLogging } from "../../utils/logger.util.js";
import {
  createPaginationSchema,
  uuidPaginationSchema,
} from "../../utils/pagination.util.js";
import { UserIdParamSchema } from "../../zodSchemas/user.zod.js";

import type { AuthenticatedRequest } from "../../types/AuthRequest.js";

const controllerLogger = createLogger({ module: "UserController" });

const getMyPosts = withLogging<AuthenticatedRequest>(
  controllerLogger, "getMyPosts",
  async ({ req, res, log }) => {
    log.info("Fetching user's own posts");

    const { limit, cursor } = uuidPaginationSchema.parse(req.query);
    const result = await postService.query.getUserPosts(
      req.user.id,
      limit,
      cursor as string | undefined,
    );

    log.info(
      {
        userId: req.user.id,
        limit,
        cursor,
        postsCount: result.posts.length,
        hasMore: result.pagination.hasMore,
        nextCursor: result.pagination.nextCursor,
      },
      "User posts fetched successfully",
    );

    res.status(200).json({
      data: result.posts,
      pagination: result.pagination,
    });
  },
);

const getPostsLikedByMe = withLogging<AuthenticatedRequest>(
  controllerLogger, "getPostsLikedByMe",
  async ({ req, res, log }) => {
    log.info("Fetching user liked posts");

    const { limit, cursor } = uuidPaginationSchema.parse(req.query);
    const result = await postService.query.getUserLikedPosts(
      req.user.id,
      limit,
      cursor as string | undefined,
    );

    log.info(
      {
        userId: req.user.id,
        limit,
        cursor,
        likedPostsCount: result.posts.length,
        hasMore: result.pagination.hasMore,
        nextCursor: result.pagination.nextCursor,
      },
      "User liked posts fetched successfully",
    );

    res.status(200).json({
      data: result.posts,
      pagination: result.pagination,
    });
  },
);

const getUserPosts = withLogging<AuthenticatedRequest>(
  controllerLogger, "getUserPosts",
  async ({ req, res, log }) => {
    log.info("Fetching user posts by ID");

    const { id: userId } = UserIdParamSchema.parse(req.params);
    const { limit, cursor } = uuidPaginationSchema.parse(req.query);

    log.debug("Verifying user exists");
    await userQueryService.userExists(userId);

    const result = await postService.query.getUserPosts(
      userId,
      limit,
      cursor as string | undefined,
    );

    log.info(
      {
        requestedUserId: userId,
        limit,
        cursor,
        postsCount: result.posts.length,
        hasMore: result.pagination.hasMore,
        nextCursor: result.pagination.nextCursor,
      },
      "User posts fetched successfully",
    );

    res.status(200).json({
      data: result.posts,
      pagination: result.pagination,
    });
  },
);

const getUserComments = withLogging<AuthenticatedRequest>(
  controllerLogger, "getUserComments",
  async ({ req, res, log }) => {
    log.info("Fetching user comments and replies");

    const { id: userId } = UserIdParamSchema.parse(req.params);
    const customPaginationSchema = createPaginationSchema(10, 50, "number");
    const { limit, cursor } = customPaginationSchema.parse(req.query);

    log.debug("Verifying user exists");
    await userQueryService.userExists(userId);

    const result = await CommentService.getUserCommentsWithRelations(
      userId,
      limit,
      cursor as string | undefined,
    );

    log.info(
      {
        requestedUserId: userId,
        limit,
        cursor,
        commentsCount: result.comments.length,
        hasMore: result.pagination.hasMore,
        nextCursor: result.pagination.nextCursor,
      },
      "User comments and replies fetched successfully",
    );

    res.status(200).json({
      data: result.comments,
      pagination: result.pagination,
    });
  },
);

const getUserMediaPosts = withLogging<AuthenticatedRequest>(
  controllerLogger, "getUserMediaPosts",
  async ({ req, res, log }) => {
    log.info("Fetching user media posts");

    const { id: userId } = UserIdParamSchema.parse(req.params);
    const { limit, cursor } = uuidPaginationSchema.parse(req.query);

    log.debug("Verifying user exists");
    await userQueryService.userExists(userId);

    const result = await postService.query.getUserMediaPosts(
      userId,
      limit,
      cursor as string | undefined,
    );

    log.info(
      {
        requestedUserId: userId,
        limit,
        cursor,
        postsCount: result.posts.length,
        hasMore: result.pagination.hasMore,
        nextCursor: result.pagination.nextCursor,
      },
      "User media posts fetched successfully",
    );

    res.status(200).json({
      data: result.posts,
      pagination: result.pagination,
    });
  },
);

export {
  getMyPosts,
  getPostsLikedByMe,
  getUserPosts,
  getUserMediaPosts,
  getUserComments,
};
