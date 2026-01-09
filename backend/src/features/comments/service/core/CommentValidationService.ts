import {
  CommentNotFoundError,
  CommentPostMismatchError,
} from "../../../../core/error/custom/comment.error.js";
import CommentRepository from "../commentRepository.js";

/**
 * CommentValidationService - Validation operations
 */
class CommentValidationService {
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
   * Validates parent comment exists and belongs to the same post
   * Throws CommentNotFoundError or CommentPostMismatchError if invalid
   */
  static async validateParentComment(parentId: number, postId: string) {
    const parentComment = await CommentRepository.findById(parentId);

    if (!parentComment) {
      throw new CommentNotFoundError(parentId);
    }

    if (parentComment.postId !== postId) {
      throw new CommentPostMismatchError(parentId, postId);
    }

    return parentComment;
  }
}

export default CommentValidationService;
