import BaseCustomError from "./base.error.js";

class ReportNotFoundError extends BaseCustomError {
  statusCode = 404;
  constructor(commentId: number) {
    super(`Comment with ID "${commentId}" not found`);
  }
}

export { ReportNotFoundError };
