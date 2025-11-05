import BaseCustomError from "./base.error";

class TagNotFoundError extends BaseCustomError {
  statusCode = 404;
  constructor(tagId: number) {
    super(`Tag with ID "${tagId}" not found`);
  }
}

class TagUpdateFailedError extends BaseCustomError {
  statusCode = 500;
  constructor(tagId: number) {
    super(`Failed to update tag with ID "${tagId}"`);
  }
}

export { TagNotFoundError, TagUpdateFailedError };
