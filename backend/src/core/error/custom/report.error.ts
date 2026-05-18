import BaseCustomError from "./base.error.js";

class ReportNotFoundError extends BaseCustomError {
  statusCode = 404;
  constructor(reportId: number) {
    super(`Report with ID "${reportId}" not found`);
  }
}

export { ReportNotFoundError };
