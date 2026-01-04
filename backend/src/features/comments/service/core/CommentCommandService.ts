import {
  CommentNotFoundError,
  CommentPostMismatchError,
} from "../../../../core/error/custom/comment.error.js";
import { PostNotFoundError } from "../../../../core/error/custom/post.error.js";
import { assertPermission } from "../../../../core/security/rbac.js";
import CommentRepository from "../commentRepository.js";

import type { CreateCommentData } from "../types.js";

/**
 * CommentCommandService - Write operations only
 */
class CommentCommandService {
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
      const parentComment = await CommentRepository.findById(data.parentId);

      if (!parentComment) {
        throw new CommentNotFoundError(data.parentId);
      }

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

  /**
   * Delete a comment with permission checks
   */
  static async deleteComment(commentId: number, user: Express.User) {
    const comment = await CommentRepository.findById(commentId);

    if (!comment) {
      throw new CommentNotFoundError(commentId);
    }

    assertPermission(user, "comments", "delete", comment);

    await CommentRepository.delete(commentId);
  }
}

export default CommentCommandService;
