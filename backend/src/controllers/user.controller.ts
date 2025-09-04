/* eslint-disable max-lines-per-function*/
import prisma from "../core/config/db.js";
import { createLogger } from "../core/config/logger.js";
import { handleError } from "../core/error/index";
import transformPostTagsToFlat from "../features/posts/postTagFlattener.js";
import { ensureAuthenticated } from "../utils/auth.util.js";
import createActionLogger from "../utils/logger.util.js";
import {
  buildPaginatedQuery,
  processPaginatedResults,
  uuidPaginationSchema,
} from "../utils/pagination.util.js";
import {
  UpdateUserProfileSchema,
  UserIdParamSchema,
} from "../zodSchemas/user.zod.js";

import type { RawPost, TransformedPost } from "../types/postTypes.js";
import type { Prisma } from "@prisma/client";
import type { Response, Request } from "express";

const controllerLogger = createLogger({ module: "UserController" });

const getUserById = async (req: Request, res: Response) => {
  const actionLogger = createActionLogger(controllerLogger, "getUserById", req);

  try {
    actionLogger.info("User fetch by ID attempt started");
    const startTime = Date.now();

    actionLogger.debug("Validating user ID parameter");
    const validationStartTime = Date.now();
    const { id: userId } = UserIdParamSchema.parse(req.params);
    const validationDuration = Date.now() - validationStartTime;

    actionLogger.info(
      {
        requestedUserId: userId,
        validationDuration,
      },
      "User ID parameter validated"
    );

    actionLogger.debug("Fetching user from database");
    const dbStartTime = Date.now();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        bio: true,
        Avatar: {
          select: { id: true, url: true },
        },
        role: true,
      },
    });
    const dbDuration = Date.now() - dbStartTime;

    if (!user) {
      const totalDuration = Date.now() - startTime;
      actionLogger.warn(
        {
          requestedUserId: userId,
          validationDuration,
          dbDuration,
          totalDuration,
        },
        "User fetch failed - user not found"
      );
      return res.status(404).json({ message: "User not found" });
    }

    const totalDuration = Date.now() - startTime;
    actionLogger.info(
      {
        requestedUserId: userId,
        foundUsername: user.username,
        userRole: user.role,
        hasAvatar: !!user.Avatar,
        hasBio: !!user.bio,
        validationDuration,
        dbDuration,
        totalDuration,
      },
      "User fetched successfully"
    );

    return res.status(200).json({
      data: {
        id: user.id,
        username: user.username,
        bio: user.bio,
        role: user.role,
        avatar: user.Avatar,
      },
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

    actionLogger.debug("Authenticating user");
    const validUser = ensureAuthenticated(req);

    actionLogger.debug("Fetching active user from database");
    const dbStartTime = Date.now();
    const user = await prisma.user.findUnique({
      where: { id: validUser.id },
      select: {
        id: true,
        username: true,
        email: true,
        bio: true,
        Avatar: {
          select: { id: true, url: true },
        },
        role: true,
        createdAt: true,
      },
    });
    const dbDuration = Date.now() - dbStartTime;

    if (!user) {
      const totalDuration = Date.now() - startTime;
      actionLogger.warn(
        {
          authenticatedUserId: validUser.id,
          dbDuration,
          totalDuration,
        },
        "Active user fetch failed - authenticated user not found in database"
      );
      return res.status(404).json({ message: "User not found" });
    }

    const totalDuration = Date.now() - startTime;
    actionLogger.info(
      {
        authenticatedUserId: validUser.id,
        username: user.username,
        userRole: user.role,
        hasAvatar: !!user.Avatar,
        hasBio: !!user.bio,
        dbDuration,
        totalDuration,
      },
      "Active user fetched successfully"
    );

    return res.status(200).json({
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        avatar: user.Avatar,
        role: user.role,
        createdAt: user.createdAt,
      },
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
    const authStartTime = Date.now();
    const user = ensureAuthenticated(req);
    const authDuration = Date.now() - authStartTime;

    actionLogger.debug("Validating profile update data");
    const validationStartTime = Date.now();
    const { bio, avatarId } = UpdateUserProfileSchema.parse(req.body);
    const validationDuration = Date.now() - validationStartTime;

    actionLogger.info(
      {
        userId: user.id,
        hasBioUpdate: !!bio,
        hasAvatarUpdate: !!avatarId,
        bioLength: bio?.length,
        authDuration,
        validationDuration,
      },
      "User authenticated and profile data validated"
    );

    actionLogger.debug("Checking if user exists");
    const userCheckStartTime = Date.now();
    const isExist = await prisma.user.findUnique({
      where: { id: user.id },
    });
    const userCheckDuration = Date.now() - userCheckStartTime;

    if (!isExist) {
      const totalDuration = Date.now() - startTime;
      actionLogger.warn(
        {
          userId: user.id,
          authDuration,
          validationDuration,
          userCheckDuration,
          totalDuration,
        },
        "Profile update failed - user not found"
      );
      return res.status(404).json({ message: "User not found" });
    }

    actionLogger.debug("Updating user profile in database");
    const dbUpdateStartTime = Date.now();
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { bio, avatarId },
      select: {
        id: true,
        username: true,
        bio: true,
        Avatar: {
          select: { id: true, url: true },
        },
        role: true,
      },
    });
    const dbUpdateDuration = Date.now() - dbUpdateStartTime;

    const totalDuration = Date.now() - startTime;
    actionLogger.info(
      {
        userId: user.id,
        username: updatedUser.username,
        updatedBio: !!updatedUser.bio,
        updatedAvatar: !!updatedUser.Avatar,
        bioLength: updatedUser.bio?.length,
        authDuration,
        validationDuration,
        userCheckDuration,
        dbUpdateDuration,
        totalDuration,
      },
      "User profile updated successfully"
    );

    return res.json({
      message: "Profile updated successfully",
      data: updatedUser,
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

    actionLogger.debug("Authenticating user");
    const user = ensureAuthenticated(req);

    actionLogger.debug("Parsing pagination parameters");
    const paginationStartTime = Date.now();
    const { limit, cursor } = uuidPaginationSchema.parse(req.query);
    const paginationParsingDuration = Date.now() - paginationStartTime;

    actionLogger.info(
      {
        userId: user.id,
        limit,
        cursor,
        hasCursor: !!cursor,
        paginationParsingDuration,
      },
      "User authenticated and pagination parameters parsed"
    );

    const baseQuery: Prisma.PostFindManyArgs = {
      where: { authorId: user.id },
      select: {
        id: true,
        title: true,
        content: true,
        type: true,
        fileUrl: true,
        fileName: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            username: true,
            Avatar: {
              select: {
                id: true,
                url: true,
              },
            },
          },
        },
        postTags: {
          include: { tag: true },
        },
        _count: {
          select: { comments: true, likes: true },
        },
      },
      orderBy: { createdAt: "desc" as const },
    };

    const paginatedQuery = buildPaginatedQuery<"post">(baseQuery, {
      limit,
      cursor,
      cursorField: "id",
    });

    actionLogger.debug("Executing database queries for posts and count");
    const dbStartTime = Date.now();
    const [posts, totalPosts] = await Promise.all([
      prisma.post.findMany(paginatedQuery),
      prisma.post.count({
        where: { authorId: user.id },
      }),
    ]);
    const dbDuration = Date.now() - dbStartTime;

    actionLogger.info(
      {
        rawPostsFound: posts.length,
        totalPosts,
        dbDuration,
      },
      "Posts and count retrieved from database"
    );

    actionLogger.debug("Transforming post data");
    const transformStartTime = Date.now();
    const transformedPosts = posts.map(
      transformPostTagsToFlat as (post: Partial<RawPost>) => TransformedPost
    );
    const transformDuration = Date.now() - transformStartTime;

    actionLogger.debug("Processing pagination results");
    const paginationProcessStartTime = Date.now();
    const { data: postsData, pagination } = processPaginatedResults(
      transformedPosts,
      limit,
      "id"
    );
    const paginationProcessDuration = Date.now() - paginationProcessStartTime;

    const totalDuration = Date.now() - startTime;
    actionLogger.info(
      {
        userId: user.id,
        limit,
        cursor,
        rawPostsFound: posts.length,
        totalPosts,
        transformedPostsCount: transformedPosts.length,
        currentPageSize: postsData.length,
        hasMore: pagination.hasMore,
        nextCursor: pagination.nextCursor,
        paginationParsingDuration,
        dbDuration,
        transformDuration,
        paginationProcessDuration,
        totalDuration,
      },
      "User posts fetched successfully"
    );

    return res.status(200).json({
      data: postsData,
      pagination: {
        hasMore: pagination.hasMore,
        nextCursor: pagination.nextCursor,
        totalPosts,
      },
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
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!userExists) {
      const totalDuration = Date.now() - startTime;
      actionLogger.warn(
        {
          requestedUserId: userId,
          totalDuration,
        },
        "User posts fetch failed - user not found"
      );
      return res.status(404).json({ message: "User not found" });
    }

    const baseQuery: Prisma.PostFindManyArgs = {
      where: { authorId: userId },
      select: {
        id: true,
        title: true,
        content: true,
        type: true,
        fileUrl: true,
        fileName: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            username: true,
            Avatar: {
              select: {
                id: true,
                url: true,
              },
            },
          },
        },
        postTags: {
          include: { tag: true },
        },
        _count: {
          select: { comments: true, likes: true },
        },
      },
      orderBy: { createdAt: "desc" as const },
    };

    const paginatedQuery = buildPaginatedQuery<"post">(baseQuery, {
      limit,
      cursor,
      cursorField: "id",
    });

    actionLogger.debug("Executing database queries for posts");
    const dbStartTime = Date.now();
    const posts = await prisma.post.findMany(paginatedQuery);
    const dbDuration = Date.now() - dbStartTime;

    actionLogger.info(
      {
        requestedUserId: userId,
        rawPostsFound: posts.length,
        dbDuration,
      },
      "Posts retrieved from database"
    );

    actionLogger.debug("Transforming post data");
    const transformedPosts = posts.map(
      transformPostTagsToFlat as (post: Partial<RawPost>) => TransformedPost
    );

    actionLogger.debug("Processing pagination results");
    const { data: postsData, pagination } = processPaginatedResults(
      transformedPosts,
      limit,
      "id"
    );

    const totalDuration = Date.now() - startTime;
    actionLogger.info(
      {
        requestedUserId: userId,
        limit,
        cursor,
        rawPostsFound: posts.length,
        transformedPostsCount: transformedPosts.length,
        currentPageSize: postsData.length,
        hasMore: pagination.hasMore,
        nextCursor: pagination.nextCursor,
        dbDuration,
        totalDuration,
      },
      "User posts fetched successfully"
    );

    return res.status(200).json({
      data: postsData,
      pagination: {
        hasMore: pagination.hasMore,
        nextCursor: pagination.nextCursor,
      },
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
};
