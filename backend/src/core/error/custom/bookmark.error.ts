import BaseCustomError from "./base.error.js";

class BookmarkNotFoundError extends BaseCustomError {
  statusCode = 404;

  constructor(postId: string) {
    super(`Bookmark for post "${postId}" not found`);
  }
}

export { BookmarkNotFoundError };
