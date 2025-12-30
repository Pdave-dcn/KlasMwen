import { createLogger } from "../core/config/logger.js";
import { handleError } from "../core/error/index.js";
import PostService from "../features/posts/service/PostService.js";
import createActionLogger from "../utils/logger.util.js";
import { SearchPostsSchema } from "../zodSchemas/search.zod.js";

import type { AuthenticatedRequest } from "../types/AuthRequest.js";
import type { Request, Response } from "express";

const controllerLogger = createLogger({ module: "SearchController" });

const searchPosts = async (req: Request, res: Response) => {
  const actionLogger = createActionLogger(controllerLogger, "searchPosts", req);

  try {
    actionLogger.info("Post search attempt started");
    const startTime = Date.now();

    const { user } = req as AuthenticatedRequest;

    const {
      limit,
      cursor,
      search: searchTerm,
      tagIds,
    } = SearchPostsSchema.parse(req.query);

    const sanitizedSearchTerm = searchTerm
      ? searchTerm.replace(/[%_]/g, "\\$&")
      : undefined;

    actionLogger.debug("Executing post search");
    const serviceStartTime = Date.now();
    const result = await PostService.searchPosts(
      user.id,
      limit,
      sanitizedSearchTerm,
      cursor as string | undefined,
      tagIds
    );
    const serviceDuration = Date.now() - serviceStartTime;

    const totalDuration = Date.now() - startTime;
    actionLogger.info(
      {
        searchTerm,
        sanitizedSearchTerm,
        totalTags: tagIds.length,
        limit,
        cursor,
        totalCount: result.pagination.totalPosts,
        hasMore: result.pagination.hasMore,
        nextCursor: result.pagination.nextCursor,
        serviceDuration,
        totalDuration,
      },
      "Post search completed successfully"
    );

    return res.status(200).json({
      data: result.posts,
      pagination: {
        hasMore: result.pagination.hasMore,
        nextCursor: result.pagination.nextCursor,
      },
      meta: {
        searchTerm,
        resultsFound: result.pagination.totalPosts,
        currentPageSize: result.posts.length,
      },
    });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

export { searchPosts };
