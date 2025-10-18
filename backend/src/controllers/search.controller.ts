/* eslint-disable max-lines-per-function*/
import { z } from "zod";

import { createLogger } from "../core/config/logger.js";
import { handleError } from "../core/error/index";
import transformPostTagsToFlat from "../features/posts/postTagFlattener.js";
import handlePostSearch from "../features/search/postSearchHandler.js";
import createActionLogger from "../utils/logger.util.js";
import {
  processPaginatedResults,
  uuidPaginationSchema,
} from "../utils/pagination.util";

import type { RawPost, TransformedPost } from "../types/postTypes";
import type { Request, Response } from "express";

const controllerLogger = createLogger({ module: "SearchController" });

const searchPosts = async (req: Request, res: Response) => {
  const actionLogger = createActionLogger(controllerLogger, "searchPosts", req);

  try {
    actionLogger.info("Post search attempt started");
    const startTime = Date.now();

    actionLogger.debug("Validating search parameters");
    const validationStartTime = Date.now();
    const searchPostsSchema = uuidPaginationSchema.extend({
      search: z
        .string()
        .trim()
        .min(2, "Search term must be at least 2 characters long")
        .max(100, "Search term must be less than 100 characters")
        .refine((val) => val.length > 0, {
          message: "Search term is required",
        }),
    });

    const {
      limit,
      cursor,
      search: searchTerm,
    } = searchPostsSchema.parse(req.query);
    const validationDuration = Date.now() - validationStartTime;

    actionLogger.debug("Sanitizing search term");
    const sanitizedSearchTerm = searchTerm.replace(/[%_]/g, "\\$&");

    actionLogger.info(
      {
        searchTerm,
        sanitizedSearchTerm,
        searchTermLength: searchTerm.length,
        limit,
        cursor,
        hasCursor: !!cursor,
        validationDuration,
      },
      "Search parameters validated and sanitized"
    );

    actionLogger.debug("Executing post search");
    const searchStartTime = Date.now();
    const { posts, totalCount } = await handlePostSearch(
      sanitizedSearchTerm,
      limit,
      cursor as string | undefined
    );
    const searchDuration = Date.now() - searchStartTime;

    actionLogger.info(
      {
        rawPostsFound: posts.length,
        totalCount,
        searchDuration,
      },
      "Post search completed"
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
        searchTerm,
        sanitizedSearchTerm,
        limit,
        cursor,
        totalCount,
        hasMore: pagination.hasMore,
        nextCursor: pagination.nextCursor,
        validationDuration,
        searchDuration,
        totalDuration,
      },
      "Post search completed successfully"
    );

    return res.status(200).json({
      data: postsData,
      pagination: {
        hasMore: pagination.hasMore,
        nextCursor: pagination.nextCursor,
      },
      meta: {
        searchTerm,
        resultsFound: totalCount,
        currentPageSize: postsData.length,
      },
    });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

export { searchPosts };
