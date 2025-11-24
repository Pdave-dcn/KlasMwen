import BaseCustomError from "./base.error.js";

class CommentNotFoundError extends BaseCustomError {
  statusCode = 404;
  constructor(commentId: number) {
    super(`Comment with ID "${commentId}" not found`);
  }
}

class CommentPostMismatchError extends BaseCustomError {
  statusCode = 400;
  constructor(commentId: number, postId: string) {
    super(
      `Comment with ID "${commentId}" does not belong to Post with ID "${postId}"`
    );
  }
}

export { CommentNotFoundError, CommentPostMismatchError };
