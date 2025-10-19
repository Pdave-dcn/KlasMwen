/* eslint-disable max-lines-per-function*/
import { createLogger } from "../core/config/logger.js";
import { handleError } from "../core/error/index";
import PostService from "../features/posts/service/PostService.js";
import { ensureAuthenticated } from "../utils/auth.util.js";
import createActionLogger from "../utils/logger.util.js";
import { SearchPostsSchema } from "../zodSchemas/search.zod.js";

import type { Request, Response } from "express";

const controllerLogger = createLogger({ module: "SearchController" });

const searchPosts = async (req: Request, res: Response) => {
  const actionLogger = createActionLogger(controllerLogger, "searchPosts", req);

  try {
    actionLogger.info("Post search attempt started");
    const startTime = Date.now();

    const user = ensureAuthenticated(req);

    actionLogger.debug("Validating search parameters");
    const {
      limit,
      cursor,
      search: searchTerm,
    } = SearchPostsSchema.parse(req.query);

    actionLogger.debug("Sanitizing search term");
    const sanitizedSearchTerm = searchTerm.replace(/[%_]/g, "\\$&");

    actionLogger.info(
      {
        searchTerm,
        sanitizedSearchTerm,
        limit,
        hasCursor: !!cursor,
      },
      "Search parameters validated and sanitized"
    );

    actionLogger.debug("Executing post search");
    const serviceStartTime = Date.now();
    const result = await PostService.getPostsBySearchTerm(
      user.id,
      sanitizedSearchTerm,
      limit,
      cursor as string | undefined
    );
    const serviceDuration = Date.now() - serviceStartTime;

    const totalDuration = Date.now() - startTime;
    actionLogger.info(
      {
        searchTerm,
        sanitizedSearchTerm,
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
