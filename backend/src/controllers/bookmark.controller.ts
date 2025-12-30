import prisma from "../core/config/db.js";
import { createLogger } from "../core/config/logger.js";
import { handleError } from "../core/error/index.js";
import PostService from "../features/posts/service/PostService.js";
import createActionLogger from "../utils/logger.util.js";
import { uuidPaginationSchema } from "../utils/pagination.util.js";
import { PostIdParamSchema } from "../zodSchemas/post.zod.js";

import type { AuthenticatedRequest } from "../types/AuthRequest.js";
import type { Request, Response } from "express";

const controllerLogger = createLogger({ module: "BookmarkController" });

const getBookmarks = async (req: Request, res: Response) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "getBookmarks",
    req
  );

  try {
    actionLogger.info("Fetching user bookmarks");
    const startTime = Date.now();

    const { user } = req as AuthenticatedRequest;
    const { limit, cursor } = uuidPaginationSchema.parse(req.query);

    actionLogger.debug("Processing user bookmarks request");
    const serviceStartTime = Date.now();
    const result = await PostService.getUserBookmarkedPosts(
      user.id,
      limit,
      cursor as string | undefined
    );
    const serviceDuration = Date.now() - serviceStartTime;

    const totalDuration = Date.now() - startTime;
    actionLogger.info(
      {
        userId: user.id,
        totalBookmarks: result.posts.length,
        hasMore: result.pagination.hasMore,
        nextCursor: result.pagination.nextCursor,
        serviceDuration,
        totalDuration,
      },
      "User bookmarks fetched successfully"
    );

    return res.status(200).json({
      data: result.posts,
      pagination: result.pagination,
    });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

const createBookmark = async (req: Request, res: Response) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "createBookmark",
    req
  );

  try {
    actionLogger.info("Creating bookmark attempt");
    const startTime = Date.now();

    const { user } = req as AuthenticatedRequest;
    const { id: postId } = PostIdParamSchema.parse(req.params);

    actionLogger.debug("Verifying post exists");
    await PostService.verifyPostExists(postId);

    const dbStartTime = Date.now();
    await prisma.bookmark.create({
      data: { userId: user.id, postId },
    });

    const dbDuration = Date.now() - dbStartTime;
    const totalDuration = Date.now() - startTime;

    actionLogger.info(
      {
        userId: user.id,
        postId,
        dbDuration,
        totalDuration,
      },
      "Bookmark created successfully"
    );

    return res.status(201).json({
      message: "Post bookmarked successfully",
    });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

const deleteBookmark = async (req: Request, res: Response) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "deleteBookmark",
    req
  );

  try {
    actionLogger.info("Deleting bookmark attempt");
    const startTime = Date.now();

    const { user } = req as AuthenticatedRequest;
    const { id: postId } = PostIdParamSchema.parse(req.params);

    actionLogger.debug("Checking if bookmark exists");
    const existingBookmark = await prisma.bookmark.findUnique({
      where: { userId_postId: { userId: user.id, postId } },
    });

    if (!existingBookmark) {
      actionLogger.warn(
        { postId, userId: user.id },
        "Attempted to delete non-existent bookmark"
      );
      return res.status(404).json({ message: "Bookmark not found" });
    }

    const dbStartTime = Date.now();
    await prisma.bookmark.delete({
      where: { userId_postId: { userId: user.id, postId } },
    });

    const dbDuration = Date.now() - dbStartTime;
    const totalDuration = Date.now() - startTime;

    actionLogger.info(
      {
        userId: user.id,
        postId,
        dbDuration,
        totalDuration,
      },
      "Bookmark deleted successfully"
    );

    return res.status(200).json({
      message: "Bookmark removed successfully",
    });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

export { getBookmarks, createBookmark, deleteBookmark };
