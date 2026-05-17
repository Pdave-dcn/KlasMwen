import { PostNotFoundError } from "../../../../core/error/custom/post.error.js";
import {
  buildPaginatedQuery,
  processPaginatedResults,
} from "../../../../utils/pagination.util.js";
import { postService } from "../../../posts/service/PostService.js";

import type { CommentTransformer } from "../commentTransformer.js";
import type { CommentRepository } from "../repositories/commentRepository.js";
import type { CommentWithRelations } from "../types/commentTypes.js";
import type { Prisma } from "@prisma/client";

class CommentQueryService {
  constructor(
    private readonly repo: typeof CommentRepository,
    private readonly transformer: typeof CommentTransformer,
  ) {}

  async getUserCommentsWithRelations(
    userId: string,
    limit = 10,
    cursor?: string,
  ) {
    const baseQuery: Prisma.CommentFindManyArgs = {};

    const paginatedQuery = buildPaginatedQuery<"comment">(baseQuery, {
      limit,
      cursor,
      cursorField: "id",
    });

    const comments = (await this.repo.findByUserWithRelations(
      userId,
      paginatedQuery,
    )) as CommentWithRelations[];

    const { data, pagination } = processPaginatedResults(comments, limit, "id");

    const transformedComments =
      this.transformer.transformCommentsForResponse(data);

    return { data: transformedComments, pagination };
  }

  async getParentComments(postId: string, limit = 10, cursor?: number) {
    const post = await postService.validate.verifyPostExists(postId);
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
      this.repo.findParentCommentsByPost(postId, paginatedQuery),
      this.repo.countByPost(postId),
    ]);

    const { data, pagination } = processPaginatedResults(comments, limit, "id");

    return {
      data,
      pagination: { ...pagination, totalComments },
    };
  }

  async getReplies(parentId: number, limit = 10, cursor?: number) {
    const baseQuery: Prisma.CommentFindManyArgs = {};

    const paginatedQuery = buildPaginatedQuery<"comment">(baseQuery, {
      limit,
      cursor,
      cursorField: "id",
    });

    const replies = await this.repo.findRepliesByParent(
      parentId,
      paginatedQuery,
    );

    const { data, pagination } = processPaginatedResults(replies, limit, "id");

    return { data, pagination };
  }
}

export { CommentQueryService };
