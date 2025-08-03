/* eslint-disable max-lines-per-function */
/* eslint-disable complexity */

import {
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
  PrismaClientRustPanicError,
  PrismaClientInitializationError,
  PrismaClientValidationError,
} from "@prisma/client/runtime/library";
import z from "zod";

import type { Response } from "express";

class ErrorHandler {
  // Zod validation errors
  static handleValidationError(error: z.ZodError) {
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

  // Handle Prisma known Errors
  static handlePrismaKnownError(error: PrismaClientKnownRequestError) {
    switch (error.code) {
      // Unique constraint violation
      case "P2002": {
        const field = error.meta?.target as string[];
        const fieldName = field?.[0] === "username" ? "username" : "email";
        return {
          status: 409,
          response: {
            message: `User with this ${fieldName} already exists.`,
          },
        };
      }

      // Record not found
      case "P2025": {
        return {
          status: 404,
          response: {
            message: "The requested record was not found.",
          },
        };
      }

      // Foreign key constraint failed
      case "P2003": {
        const field = error.meta?.field_name as string;
        return {
          status: 400,
          response: {
            message: `Invalid reference: ${
              field ? `field '${field}'` : "foreign key constraint failed"
            }.`,
          },
        };
      }

      // Required relation violation
      case "P2014": {
        const relation = error.meta?.relation_name as string;
        return {
          status: 400,
          response: {
            message: `Cannot modify record: required relation${
              relation ? ` '${relation}'` : ""
            } would be violated.`,
          },
        };
      }

      // Null constraint violation
      case "P2011": {
        const constraint = error.meta?.constraint as string;
        return {
          status: 400,
          response: {
            message: `Missing required field${
              constraint ? `: ${constraint}` : ""
            }.`,
          },
        };
      }

      // Missing required value
      case "P2012": {
        const path = error.meta?.path as string;
        return {
          status: 400,
          response: {
            message: `Missing required value${path ? ` at ${path}` : ""}.`,
          },
        };
      }

      // Value too long for column
      case "P2000": {
        const column = error.meta?.column_name as string;
        return {
          status: 400,
          response: {
            message: `Value too long${column ? ` for field '${column}'` : ""}.`,
          },
        };
      }

      // Invalid field value
      case "P2006": {
        const field = error.meta?.field_name as string;
        return {
          status: 400,
          response: {
            message: `Invalid value${field ? ` for field '${field}'` : ""}.`,
          },
        };
      }

      // Connection timeout
      case "P2024": {
        return {
          status: 503,
          response: {
            message: "Database connection timeout. Please try again later.",
          },
        };
      }

      // Transaction failed (deadlock/write conflict)
      case "P2034": {
        return {
          status: 409,
          response: {
            message: "Operation failed due to concurrent access. Please retry.",
          },
        };
      }

      // Database authentication failed
      case "P1000": {
        console.error("Database authentication failed:", error.message);
        return {
          status: 500,
          response: {
            message: "Database connection error.",
          },
        };
      }

      // Database server unreachable
      case "P1001": {
        console.error("Database server unreachable:", error.message);
        return {
          status: 503,
          response: {
            message:
              "Database temporarily unavailable. Please try again later.",
          },
        };
      }

      // Database does not exist
      case "P1003": {
        console.error("Database does not exist:", error.message);
        return {
          status: 500,
          response: {
            message: "Database configuration error.",
          },
        };
      }

      // Default case for unhandled Prisma errors
      default: {
        console.error(`Unhandled Prisma Error [${error.code}]:`, error.message);
        return {
          status: 500,
          response: {
            message: "Internal server error",
          },
        };
      }
    }
  }

  // Handle Prisma Client Validation Errors
  static handlePrismaValidationError(error: PrismaClientValidationError) {
    console.error("Prisma Validation Error:", error.message);
    return {
      status: 400,
      response: {
        message: "Invalid query parameters or data structure.",
      },
    };
  }

  // Handle Prisma Client Initialization Errors
  static handlePrismaInitializationError(
    error: PrismaClientInitializationError
  ) {
    console.error("Prisma Initialization Error:", error.message);
    return {
      status: 503,
      response: {
        message: "Database service temporarily unavailable.",
      },
    };
  }

  // Handle Prisma Client Unknown Request Errors
  static handlePrismaUnknownError(error: PrismaClientUnknownRequestError) {
    console.error("Prisma Unknown Error:", error.message);
    return {
      status: 500,
      response: {
        message: "An unexpected database error occurred.",
      },
    };
  }

  // Handle Prisma Client Rust Panic Errors
  static handlePrismaRustPanicError(error: PrismaClientRustPanicError) {
    console.error("Prisma Rust Panic Error:", error.message);
    return {
      status: 500,
      response: {
        message: "Critical database error. Please try again later.",
      },
    };
  }

  // Handle JWT Errors
  static handleJWTError(error: Error) {
    console.error("JWT Error:", error.message);
    if (error.name === "TokenExpiredError") {
      return {
        status: 401,
        response: {
          message: "Token has expired. Please log in again.",
        },
      };
    }
    if (error.name === "JsonWebTokenError") {
      return {
        status: 401,
        response: {
          message: "Invalid token. Please log in again.",
        },
      };
    }
    if (error.name === "NotBeforeError") {
      return {
        status: 401,
        response: {
          message: "Token not active yet.",
        },
      };
    }
    return {
      status: 401,
      response: {
        message: "Authentication failed.",
      },
    };
  }

  // Handle bcrypt errors
  static handleBcryptError(error: Error) {
    console.error("Bcrypt Error:", error.message);
    return {
      status: 500,
      response: {
        message: "Password processing error.",
      },
    };
  }

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

export const handleError = (error: unknown, res: Response): Response => {
  let errorResponse;

  // Handle Zod validation errors
  if (error instanceof z.ZodError) {
    errorResponse = ErrorHandler.handleValidationError(error);
  }
  // Handle Prisma errors (in order of specificity)
  else if (error instanceof PrismaClientKnownRequestError) {
    errorResponse = ErrorHandler.handlePrismaKnownError(error);
  } else if (error instanceof PrismaClientValidationError) {
    errorResponse = ErrorHandler.handlePrismaValidationError(error);
  } else if (error instanceof PrismaClientInitializationError) {
    errorResponse = ErrorHandler.handlePrismaInitializationError(error);
  } else if (error instanceof PrismaClientUnknownRequestError) {
    errorResponse = ErrorHandler.handlePrismaUnknownError(error);
  } else if (error instanceof PrismaClientRustPanicError) {
    errorResponse = ErrorHandler.handlePrismaRustPanicError(error);
  }
  // Handle JWT-related errors
  else if (
    error instanceof Error &&
    (error.name === "TokenExpiredError" ||
      error.name === "JsonWebTokenError" ||
      error.name === "NotBeforeError")
  ) {
    errorResponse = ErrorHandler.handleJWTError(error);
  }
  // Handle bcrypt errors
  else if (error instanceof Error && error.message.includes("bcrypt")) {
    errorResponse = ErrorHandler.handleBcryptError(error);
  }
  // Handle all other errors
  else {
    errorResponse = ErrorHandler.handleGenericError(error);
  }

  return res.status(errorResponse.status).json(errorResponse.response);
};

/*
COVERAGE:

✅ CURRENTLY HANDLED:
- Zod validation errors
- Most common Prisma known request errors (P2002, P2025, P2003, etc.)
- All Prisma error types (PrismaClientValidationError, PrismaClientInitializationError, etc.)
- JWT-specific errors (expired, invalid, not before)
- bcrypt-related errors
- Network errors (ECONNREFUSED, ETIMEDOUT)
- String errors
- Generic error handling

❌ STILL NOT HANDLED
- Rate limiting errors
- File upload errors (multer)
- CORS errors
- Custom business logic errors
- Third-party API errors
- Memory/resource limit errors
*/
