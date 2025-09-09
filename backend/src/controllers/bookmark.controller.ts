import prisma from "../core/config/db.js";
import { createLogger } from "../core/config/logger.js";
import { handleError } from "../core/error/index.js";
import PostService from "../features/posts/postService.js";
import { ensureAuthenticated } from "../utils/auth.util.js";
import createActionLogger from "../utils/logger.util.js";
import { uuidPaginationSchema } from "../utils/pagination.util.js";
import { PostIdParamSchema } from "../zodSchemas/post.zod.js";

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

    const user = ensureAuthenticated(req);
    actionLogger.info({ userId: user.id }, "User authenticated");

    const { limit, cursor } = uuidPaginationSchema.parse(req.query);
    actionLogger.debug(
      { limit, cursor, hasCursor: !!cursor },
      "Pagination parameters parsed"
    );

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

    const user = ensureAuthenticated(req);
    const userId = user.id;
    actionLogger.info({ userId }, "User authenticated");

    actionLogger.debug("Parsing post ID parameter");
    const { id: postId } = PostIdParamSchema.parse(req.params);

    actionLogger.info({ postId, userId }, "Creating bookmark for post");

    actionLogger.debug("Verifying post exists");
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      actionLogger.warn({ postId }, "Attempted to bookmark non-existent post");
      return res.status(404).json({ message: "Post not found" });
    }

    actionLogger.debug(
      { postId, postTitle: post.title },
      "Post found, creating bookmark"
    );

    const dbStartTime = Date.now();
    await prisma.bookmark.create({
      data: { userId, postId },
    });

    const dbDuration = Date.now() - dbStartTime;
    const totalDuration = Date.now() - startTime;

    actionLogger.info(
      {
        userId,
        postId,
        postTitle: post.title,
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

    const user = ensureAuthenticated(req);
    const userId = user.id;
    actionLogger.info({ userId }, "User authenticated");

    actionLogger.debug("Parsing post ID parameter");
    const { id: postId } = PostIdParamSchema.parse(req.params);

    actionLogger.info({ postId, userId }, "Deleting bookmark for post");

    actionLogger.debug("Checking if bookmark exists");
    const existingBookmark = await prisma.bookmark.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (!existingBookmark) {
      actionLogger.warn(
        { postId, userId },
        "Attempted to delete non-existent bookmark"
      );
      return res.status(404).json({ message: "Bookmark not found" });
    }

    actionLogger.debug(
      { postId, userId },
      "Bookmark found, proceeding with deletion"
    );

    const dbStartTime = Date.now();
    await prisma.bookmark.delete({
      where: { userId_postId: { userId, postId } },
    });

    const dbDuration = Date.now() - dbStartTime;
    const totalDuration = Date.now() - startTime;

    actionLogger.info(
      {
        userId,
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
