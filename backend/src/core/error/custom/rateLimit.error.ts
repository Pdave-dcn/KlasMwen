import BaseCustomError from "./base.error.js";

class RateLimitError extends BaseCustomError {
  statusCode = 429;

  constructor(message: string) {
    super(message);
  }
}

export default RateLimitError;
