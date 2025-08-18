import { handleError } from "../core/error/index";
import transformPostTagsToFlat from "../features/posts/postTagFlattener.js";
import handlePostSearch from "../features/search/postSearchHandler.js";

import type { RawPost, TransformedPost } from "../types/postTypes";
import type { Request, Response } from "express";

const searchPosts = async (req: Request, res: Response) => {
  try {
    const searchTerm = req.query.search as string;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const cursor = req.query.cursor as string | undefined;

    if (!searchTerm || typeof searchTerm !== "string") {
      return res.status(400).json({
        message: "Search term is required and must be a string",
      });
    }

    const trimmedSearchTerm = searchTerm.trim();
    if (trimmedSearchTerm.length < 2) {
      return res.status(400).json({
        message: "Search term must be at least 2 characters long",
      });
    }

    if (trimmedSearchTerm.length > 100) {
      return res.status(400).json({
        message: "Search term must be less than 100 characters",
      });
    }

    if (cursor && typeof cursor !== "string") {
      return res.status(400).json({
        message: "Invalid cursor format",
      });
    }

    const sanitizedSearchTerm = trimmedSearchTerm.replace(/[%_]/g, "\\$&");

    const { posts, totalCount } = await handlePostSearch(
      sanitizedSearchTerm,
      limit,
      cursor
    );

    const hasMore = posts.length > limit;
    const postsSlice = posts.slice(0, limit);
    const nextCursor = hasMore ? postsSlice[postsSlice.length - 1].id : null;

    const transformedPosts = postsSlice.map(
      transformPostTagsToFlat as (post: Partial<RawPost>) => TransformedPost
    );

    return res.status(200).json({
      data: transformedPosts,
      pagination: {
        hasMore,
        nextCursor,
        total: transformedPosts.length,
      },
      meta: {
        searchTerm: trimmedSearchTerm,
        resultsFound: totalCount,
        currentPageSize: transformedPosts.length,
      },
    });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

export { searchPosts };
