import BaseCustomError from "./base.error";

/**
 * Error thrown when a user is not found
 */
class UserNotFoundError extends BaseCustomError {
  statusCode = 404;

  constructor(userId: string) {
    super(`User with ID "${userId}" not found`);
  }
}

export { UserNotFoundError };
