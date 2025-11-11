import {
  CommentNotFoundError,
  CommentPostMismatchError,
} from "../../../core/error/custom/comment.error";
import { PostNotFoundError } from "../../../core/error/custom/post.error";
import { checkPermission } from "../../../utils/auth.util";
import {
  buildPaginatedQuery,
  processPaginatedResults,
} from "../../../utils/pagination.util";

import CommentRepository from "./commentRepository";
import CommentTransformer from "./commentTransformer";

import type { CreateCommentData, CommentWithRelations } from "./types";
import type { Prisma } from "@prisma/client";

/**
 * Service layer for Comment business logic
 * Orchestrates repository calls and applies business rules
 */
class CommentService {
  /**
   * Checks if a comment exists by ID.
   * Throws CommentNotFoundError if the comment is not found.
   */
  static async commentExists(commentId: number) {
    const comment = await CommentRepository.findById(commentId);
    if (!comment) {
      throw new CommentNotFoundError(commentId);
    }
    return comment;
  }

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

  /**
   * Create a new comment with validation
   */
  static async createComment(data: CreateCommentData) {
    // Validate post exists
    const postExists = await CommentRepository.postExists(data.postId);
    if (!postExists) {
      throw new PostNotFoundError(data.postId);
    }

    let mentionedUserId: string | undefined;
    let finalParentId: number | null = data.parentId ?? null;

    // Handle parent comment logic
    if (data.parentId) {
      const parentComment = await this.commentExists(data.parentId);

      // Validate parent comment belongs to same post
      if (parentComment.postId !== data.postId) {
        throw new CommentPostMismatchError(data.parentId, data.postId);
      }

      // Handle nested replies (flatten to 2 levels)
      if (parentComment.parentId) {
        // If replying to a reply, attach to original parent
        finalParentId = parentComment.parentId;
        mentionedUserId = parentComment.authorId;
      } else {
        // If replying to a parent comment
        finalParentId = parentComment.id;
      }
    }

    // Create the comment
    const newComment = await CommentRepository.create({
      content: data.content,
      author: { connect: { id: data.authorId } },
      post: { connect: { id: data.postId } },
      ...(finalParentId && { parent: { connect: { id: finalParentId } } }),
      ...(mentionedUserId && {
        mentionedUser: { connect: { id: mentionedUserId } },
      }),
    });

    return newComment;
  }

  static async deleteComment(commentId: number, user: Express.User) {
    const comment = await this.commentExists(commentId);

    checkPermission(user, comment);

    await CommentRepository.delete(commentId);
  }
}

export default CommentService;
