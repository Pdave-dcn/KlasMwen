import {
  CommentNotFoundError,
  CommentPostMismatchError,
} from "../../../../core/error/custom/comment.error.js";

import type { CommentRepository } from "../repositories/commentRepository.js";

class CommentValidationService {
  constructor(private readonly repo: typeof CommentRepository) {}

  async commentExists(commentId: number) {
    const comment = await this.repo.findById(commentId);
    if (!comment) {
      throw new CommentNotFoundError(commentId);
    }
    return comment;
  }

  async validateParentComment(parentId: number, postId: string) {
    const parentComment = await this.repo.findById(parentId);

    if (!parentComment) {
      throw new CommentNotFoundError(parentId);
    }

    if (parentComment.postId !== postId) {
      throw new CommentPostMismatchError(parentId, postId);
    }

    return parentComment;
  }
}

export { CommentValidationService };
