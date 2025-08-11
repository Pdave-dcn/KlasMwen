/* eslint-disable max-lines-per-function */

class GenericErrorHandler {
  // Generic error handler
  static handleGenericError(error: unknown) {
    // Handle standard Error objects
    if (error instanceof Error) {
      console.error(`Generic Error [${error.name}]:`, error.message);

      // Handle specific error types that might not be caught elsewhere
      if (error.message.includes("ECONNREFUSED")) {
        return {
          status: 503,
          response: {
            message: "Service temporarily unavailable.",
          },
        };
      }

      if (error.message.includes("ETIMEDOUT")) {
        return {
          status: 408,
          response: {
            message: "Request timeout. Please try again.",
          },
        };
      }

      // Handle file system errors
      if (error.message.includes("ENOENT")) {
        return {
          status: 404,
          response: {
            message: "File or directory not found.",
          },
        };
      }

      if (error.message.includes("EACCES") || error.message.includes("EPERM")) {
        return {
          status: 403,
          response: {
            message: "Permission denied.",
          },
        };
      }

      if (error.message.includes("ENOSPC")) {
        return {
          status: 507,
          response: {
            message: "Insufficient storage space.",
          },
        };
      }

      return {
        status: 500,
        response: {
          message: "Internal server error",
        },
      };
    }

    // Handle string errors (rare but possible)
    if (typeof error === "string") {
      console.error("String Error:", error);
      return {
        status: 500,
        response: {
          message: "Internal server error",
        },
      };
    }

    // Handle completely unknown errors
    console.error("Unknown Error:", error);
    return {
      status: 500,
      response: {
        message: "Internal server error",
      },
    };
  }
}

export default GenericErrorHandler;
