import prisma from "../../../core/config/db";

import { BaseSelectors } from "./types";

import type { Prisma } from "@prisma/client";

/**
 * Repository layer for Comment data access
 * Handles only direct Prisma operations
 */
class CommentRepository {
  /**
   * Find comments by user with full relations
   */
  static findByUserWithRelations(
    userId: string,
    query: Prisma.CommentFindManyArgs
  ) {
    return prisma.comment.findMany({
      ...query,
      where: { ...query.where, authorId: userId },
      include: BaseSelectors.commentRelations,
    });
  }

  /**
   * Find parent comments (top-level) for a post
   */
  static findParentCommentsByPost(
    postId: string,
    query: Prisma.CommentFindManyArgs
  ) {
    return prisma.comment.findMany({
      ...query,
      where: { ...query.where, postId, parentId: null },
      select: BaseSelectors.comment,
    });
  }

  /**
   * Count total comments for a post
   */
  static countByPost(postId: string) {
    return prisma.comment.count({ where: { postId } });
  }

  /**
   * Find replies for a parent comment
   */
  static findRepliesByParent(
    parentId: number,
    query: Prisma.CommentFindManyArgs
  ) {
    return prisma.comment.findMany({
      ...query,
      where: { ...query.where, parentId },
      orderBy: { createdAt: "asc" },
      select: BaseSelectors.reply,
    });
  }

  /**
   * Find a single comment by ID
   */
  static findById(commentId: number) {
    return prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, parentId: true, authorId: true, postId: true },
    });
  }

  /**
   * Check if a post exists
   */
  static async postExists(postId: string): Promise<boolean> {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });
    return !!post;
  }

  /**
   * Create a new comment
   */
  static create(data: Prisma.CommentCreateInput) {
    return prisma.comment.create({
      data,
    });
  }

  /**
   * Delete a comment by ID
   */
  static delete(commentId: number) {
    return prisma.comment.delete({
      where: { id: commentId },
    });
  }
}

export default CommentRepository;
