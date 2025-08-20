import { z } from "zod";

import { handleError } from "../core/error/index";
import transformPostTagsToFlat from "../features/posts/postTagFlattener.js";
import handlePostSearch from "../features/search/postSearchHandler.js";
import {
  processPaginatedResults,
  uuidPaginationSchema,
} from "../utils/pagination.util";

import type { RawPost, TransformedPost } from "../types/postTypes";
import type { Request, Response } from "express";

const searchPosts = async (req: Request, res: Response) => {
  try {
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

    const sanitizedSearchTerm = searchTerm.replace(/[%_]/g, "\\$&");

    const { posts, totalCount } = await handlePostSearch(
      sanitizedSearchTerm,
      limit,
      cursor as string | undefined
    );

    const transformedPosts = posts.map(
      transformPostTagsToFlat as (post: Partial<RawPost>) => TransformedPost
    );

    const { data: postsData, pagination } = processPaginatedResults(
      transformedPosts,
      limit,
      "id"
    );

    return res.status(200).json({
      data: postsData,
      pagination: {
        hasMore: pagination.hasMore,
        nextCursor: pagination.nextCursor,
        total: postsData.length,
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
