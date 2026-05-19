import { createLogger } from "../core/config/logger.js";
import { postService } from "../features/posts/service/PostService.js";
import { withLogging } from "../utils/logger.util.js";
import { SearchPostsSchema } from "../zodSchemas/search.zod.js";

import type { AuthenticatedRequest } from "../types/AuthRequest.js";

const controllerLogger = createLogger({ module: "SearchController" });

const searchPosts = withLogging<AuthenticatedRequest>(
  controllerLogger,
  "searchPosts",
  async ({ req, res, log }) => {
    log.info("Post search attempt started");

    const {
      limit,
      cursor,
      search: searchTerm,
      tagIds,
    } = SearchPostsSchema.parse(req.query);

    const sanitizedSearchTerm = searchTerm
      ? searchTerm.replace(/[%_]/g, "\\$&")
      : undefined;

    log.debug("Executing post search");
    const result = await postService.search.searchPosts(
      req.user.id,
      limit,
      sanitizedSearchTerm,
      cursor as string | undefined,
      tagIds,
    );

    log.info(
      {
        searchTerm,
        sanitizedSearchTerm,
        totalTags: tagIds.length,
        limit,
        cursor,
        totalCount: result.pagination.totalPosts,
        hasMore: result.pagination.hasMore,
        nextCursor: result.pagination.nextCursor,
      },
      "Post search completed successfully",
    );

    res.status(200).json({
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
  },
);

export { searchPosts };
