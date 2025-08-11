/* eslint-disable max-lines-per-function */
/* eslint-disable complexity */
import type {
  PrismaClientInitializationError,
  PrismaClientKnownRequestError,
  PrismaClientRustPanicError,
  PrismaClientUnknownRequestError,
  PrismaClientValidationError,
} from "@prisma/client/runtime/library";

class DatabaseErrorHandler {
  // Zod validation errors
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
}

export default DatabaseErrorHandler;
