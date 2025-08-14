import BaseCustomError from "./base.error";

class AuthenticationError extends BaseCustomError {
  statusCode = 401;
  constructor(message = "Unauthorized") {
    super(message);
  }
}

class AuthorizationError extends BaseCustomError {
  statusCode = 403;

  constructor(message = "Forbidden") {
    super(message);
  }
}

export { AuthenticationError, AuthorizationError };
