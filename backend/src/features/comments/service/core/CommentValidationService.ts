import { CommentNotFoundError } from "../../../../core/error/custom/comment.error.js";
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
}

export default CommentValidationService;
