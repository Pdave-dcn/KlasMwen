import type { ZodError } from "zod";

class ValidationErrorHandler {
  // Zod validation errors
  static handleValidationError(error: ZodError) {
    return {
      status: 400,
      response: {
        message: "Validation failed",
        errors: error.issues.map((err) => ({
          path: err.path.join("."),
          message: err.message,
        })),
      },
    };
  }
}

export default ValidationErrorHandler;
