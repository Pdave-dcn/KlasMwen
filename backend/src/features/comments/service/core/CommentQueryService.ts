import { PostNotFoundError } from "../../../../core/error/custom/post.error.js";
import {
  buildPaginatedQuery,
  processPaginatedResults,
} from "../../../../utils/pagination.util.js";
import CommentRepository from "../commentRepository.js";
import CommentTransformer from "../commentTransformer.js";

import type { CommentWithRelations } from "../types.js";
import type { Prisma } from "@prisma/client";

/**
 * CommentQueryService - Read operations only
 */
class CommentQueryService {
  /**
   * Get user's comments with all related data
   */
  static async getUserCommentsWithRelations(
    userId: string,
    limit = 10,
    cursor?: string
  ) {
    const baseQuery: Prisma.CommentFindManyArgs = {};

    const paginatedQuery = buildPaginatedQuery<"comment">(baseQuery, {
      limit,
      cursor,
      cursorField: "id",
    });

    const comments = (await CommentRepository.findByUserWithRelations(
      userId,
      paginatedQuery
    )) as CommentWithRelations[];

    const { data, pagination } = processPaginatedResults(comments, limit, "id");

    const transformedComments =
      CommentTransformer.transformCommentsForResponse(data);

    return {
      comments: transformedComments,
      pagination,
    };
  }

  /**
   * Get parent comments for a post
   */
  static async getParentComments(postId: string, limit = 10, cursor?: number) {
    const post = await CommentRepository.postExists(postId);
    if (!post) {
      throw new PostNotFoundError(postId);
    }

    const baseQuery: Prisma.CommentFindManyArgs = {};

    const paginatedQuery = buildPaginatedQuery<"comment">(baseQuery, {
      limit,
      cursor,
      cursorField: "id",
    });

    const [comments, totalComments] = await Promise.all([
      CommentRepository.findParentCommentsByPost(postId, paginatedQuery),
      CommentRepository.countByPost(postId),
    ]);

    const { data, pagination } = processPaginatedResults(comments, limit, "id");

    return {
      comments: data,
      pagination: { ...pagination, totalComments },
    };
  }

  /**
   * Get replies for a parent comment
   */
  static async getReplies(parentId: number, limit = 10, cursor?: number) {
    const baseQuery: Prisma.CommentFindManyArgs = {};

    const paginatedQuery = buildPaginatedQuery<"comment">(baseQuery, {
      limit,
      cursor,
      cursorField: "id",
    });

    const replies = await CommentRepository.findRepliesByParent(
      parentId,
      paginatedQuery
    );

    const { data, pagination } = processPaginatedResults(replies, limit, "id");

    return {
      replies: data,
      pagination,
    };
  }
}

export default CommentQueryService;
