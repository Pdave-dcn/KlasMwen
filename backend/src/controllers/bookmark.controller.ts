import { createLogger } from "../core/config/logger.js";
import { bookmarkService } from "../features/bookmark/service/index.js";
import { withLogging } from "../utils/logger.util.js";
import { uuidPaginationSchema } from "../utils/pagination.util.js";
import { PostIdParamSchema } from "../zodSchemas/post.zod.js";

import type { AuthenticatedRequest } from "../types/AuthRequest.js";

const controllerLogger = createLogger({ module: "BookmarkController" });

const getBookmarks = withLogging(
  controllerLogger,
  "getBookmarks",
  async ({ req, res, log }) => {
    const { user } = req as AuthenticatedRequest;
    const { limit, cursor } = uuidPaginationSchema.parse(req.query);

    log.debug("Processing user bookmarks request");
    const result = await bookmarkService.getBookmarks(
      user.id,
      limit,
      cursor as string | undefined,
    );

    log.info(
      {
        userId: user.id,
        totalBookmarks: result.data.length,
        hasMore: result.pagination.hasMore,
        nextCursor: result.pagination.nextCursor,
      },
      "User bookmarks fetched successfully",
    );

    res.status(200).json(result);
  },
);

const createBookmark = withLogging(
  controllerLogger,
  "createBookmark",
  async ({ req, res, log }) => {
    const { user } = req as AuthenticatedRequest;
    const { id: postId } = PostIdParamSchema.parse(req.params);

    log.debug("Creating bookmark");
    await bookmarkService.createBookmark(user.id, postId);

    log.info({ userId: user.id, postId }, "Bookmark created successfully");
    res.status(201).json({ message: "Post bookmarked successfully" });
  },
);

const deleteBookmark = withLogging(
  controllerLogger,
  "deleteBookmark",
  async ({ req, res, log }) => {
    const { user } = req as AuthenticatedRequest;
    const { id: postId } = PostIdParamSchema.parse(req.params);

    log.debug({ postId, userId: user.id }, "Deleting bookmark");
    await bookmarkService.deleteBookmark(user.id, postId);

    log.info({ userId: user.id, postId }, "Bookmark deleted successfully");
    res.status(200).json({ message: "Bookmark removed successfully" });
  },
);

export { getBookmarks, createBookmark, deleteBookmark };
