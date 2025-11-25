import BaseCustomError from "./base.error.js";

/**
 * Error thrown when a post is not found
 */
class PostNotFoundError extends BaseCustomError {
  statusCode = 404;

  constructor(postId: string) {
    super(`Post with ID "${postId}" not found`);
  }
}

/**
 * Error thrown when post update fails
 */
class PostUpdateFailedError extends BaseCustomError {
  constructor(postId: string, reason?: string, public statusCode = 500) {
    super(
      reason
        ? `Failed to update post "${postId}": ${reason}`
        : `Failed to update post "${postId}"`
    );
  }
}

class PostCreationFailedError extends BaseCustomError {
  statusCode = 500;

  constructor() {
    super("Failed to create post in database");
  }
}

export { PostNotFoundError, PostUpdateFailedError, PostCreationFailedError };
