import {
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
  PrismaClientRustPanicError,
  PrismaClientInitializationError,
  PrismaClientValidationError,
} from "@prisma/client/runtime/library";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { z } from "zod";

import { handleError } from "../core/error/errorHandler";

import type { Response } from "express";

// Mock Response object
const createMockResponse = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
};

// Mock console methods
const consoleMock = {
  error: vi.fn(),
};

describe("Error Handler", () => {
  let mockRes: Response;

  beforeEach(() => {
    mockRes = createMockResponse();
    vi.spyOn(console, "error").mockImplementation(consoleMock.error);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Zod Validation Errors", () => {
    it("should handle Zod validation errors with multiple issues", () => {
      const zodSchema = z.object({
        email: z.string().email(),
        age: z.number().min(18),
        name: z.string().min(2),
      });

      try {
        zodSchema.parse({
          email: "invalid-email",
          age: 15,
          name: "A",
        });
      } catch (error) {
        const result = handleError(error, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          message: "Validation failed",
          errors: expect.arrayContaining([
            expect.objectContaining({
              path: "email",
              message: expect.stringContaining("email"),
            }),
            expect.objectContaining({
              path: "age",
              message: expect.stringContaining("18"),
            }),
            expect.objectContaining({
              path: "name",
              message: expect.stringContaining("2"),
            }),
          ]),
        });
        expect(result).toBe(mockRes);
      }
    });

    it("should handle Zod validation errors with nested paths", () => {
      const zodSchema = z.object({
        user: z.object({
          profile: z.object({
            email: z.string().email(),
          }),
        }),
      });

      try {
        zodSchema.parse({
          user: {
            profile: {
              email: "invalid-email",
            },
          },
        });
      } catch (error) {
        handleError(error, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          message: "Validation failed",
          errors: [
            {
              path: "user.profile.email",
              message: expect.stringContaining("email"),
            },
          ],
        });
      }
    });
  });

  describe("Prisma Known Request Errors", () => {
    it("should handle P2002 unique constraint violation for username", () => {
      const error = new PrismaClientKnownRequestError(
        "Unique constraint failed",
        {
          code: "P2002",
          clientVersion: "5.0.0",
          meta: {
            target: ["username"],
          },
        }
      );

      handleError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "User with this username already exists.",
      });
    });

    it("should handle P2002 unique constraint violation for email", () => {
      const error = new PrismaClientKnownRequestError(
        "Unique constraint failed",
        {
          code: "P2002",
          clientVersion: "5.0.0",
          meta: {
            target: ["email"],
          },
        }
      );

      handleError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "User with this email already exists.",
      });
    });

    it("should handle P2025 record not found", () => {
      const error = new PrismaClientKnownRequestError("Record not found", {
        code: "P2025",
        clientVersion: "5.0.0",
      });

      handleError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "The requested record was not found.",
      });
    });

    it("should handle P2003 foreign key constraint failed", () => {
      const error = new PrismaClientKnownRequestError(
        "Foreign key constraint failed",
        {
          code: "P2003",
          clientVersion: "5.0.0",
          meta: {
            field_name: "userId",
          },
        }
      );

      handleError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Invalid reference: field 'userId'.",
      });
    });

    it("should handle P2014 required relation violation", () => {
      const error = new PrismaClientKnownRequestError(
        "Required relation violation",
        {
          code: "P2014",
          clientVersion: "5.0.0",
          meta: {
            relation_name: "UserPosts",
          },
        }
      );

      handleError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message:
          "Cannot modify record: required relation 'UserPosts' would be violated.",
      });
    });

    it("should handle P2011 null constraint violation", () => {
      const error = new PrismaClientKnownRequestError(
        "Null constraint violation",
        {
          code: "P2011",
          clientVersion: "5.0.0",
          meta: {
            constraint: "email",
          },
        }
      );

      handleError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Missing required field: email.",
      });
    });

    it("should handle P2012 missing required value", () => {
      const error = new PrismaClientKnownRequestError(
        "Missing required value",
        {
          code: "P2012",
          clientVersion: "5.0.0",
          meta: {
            path: "data.username",
          },
        }
      );

      handleError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Missing required value at data.username.",
      });
    });

    it("should handle P2000 value too long for column", () => {
      const error = new PrismaClientKnownRequestError("Value too long", {
        code: "P2000",
        clientVersion: "5.0.0",
        meta: {
          column_name: "username",
        },
      });

      handleError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Value too long for field 'username'.",
      });
    });

    it("should handle P2006 invalid field value", () => {
      const error = new PrismaClientKnownRequestError("Invalid field value", {
        code: "P2006",
        clientVersion: "5.0.0",
        meta: {
          field_name: "age",
        },
      });

      handleError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Invalid value for field 'age'.",
      });
    });

    it("should handle P2024 connection timeout", () => {
      const error = new PrismaClientKnownRequestError("Connection timeout", {
        code: "P2024",
        clientVersion: "5.0.0",
      });

      handleError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Database connection timeout. Please try again later.",
      });
    });

    it("should handle P2034 transaction failed", () => {
      const error = new PrismaClientKnownRequestError("Transaction failed", {
        code: "P2034",
        clientVersion: "5.0.0",
      });

      handleError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Operation failed due to concurrent access. Please retry.",
      });
    });

    it("should handle P1000 database authentication failed", () => {
      const error = new PrismaClientKnownRequestError("Authentication failed", {
        code: "P1000",
        clientVersion: "5.0.0",
      });

      handleError(error, mockRes);

      expect(consoleMock.error).toHaveBeenCalledWith(
        "Database authentication failed:",
        "Authentication failed"
      );
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Database connection error.",
      });
    });

    it("should handle P1001 database server unreachable", () => {
      const error = new PrismaClientKnownRequestError("Server unreachable", {
        code: "P1001",
        clientVersion: "5.0.0",
      });

      handleError(error, mockRes);

      expect(consoleMock.error).toHaveBeenCalledWith(
        "Database server unreachable:",
        "Server unreachable"
      );
      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Database temporarily unavailable. Please try again later.",
      });
    });

    it("should handle P1003 database does not exist", () => {
      const error = new PrismaClientKnownRequestError(
        "Database does not exist",
        {
          code: "P1003",
          clientVersion: "5.0.0",
        }
      );

      handleError(error, mockRes);

      expect(consoleMock.error).toHaveBeenCalledWith(
        "Database does not exist:",
        "Database does not exist"
      );
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Database configuration error.",
      });
    });

    it("should handle unknown Prisma error codes", () => {
      const error = new PrismaClientKnownRequestError("Unknown error", {
        code: "P9999" as any,
        clientVersion: "5.0.0",
      });

      handleError(error, mockRes);

      expect(consoleMock.error).toHaveBeenCalledWith(
        "Unhandled Prisma Error [P9999]:",
        "Unknown error"
      );
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Internal server error",
      });
    });
  });

  describe("Other Prisma Error Types", () => {
    it("should handle PrismaClientValidationError", () => {
      const error = new PrismaClientValidationError(
        "Invalid query parameters",
        { clientVersion: "5.0.0" }
      );

      handleError(error, mockRes);

      expect(consoleMock.error).toHaveBeenCalledWith(
        "Prisma Validation Error:",
        "Invalid query parameters"
      );
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Invalid query parameters or data structure.",
      });
    });

    it("should handle PrismaClientInitializationError", () => {
      const error = new PrismaClientInitializationError(
        "Initialization failed",
        "5.0.0"
      );

      handleError(error, mockRes);

      expect(consoleMock.error).toHaveBeenCalledWith(
        "Prisma Initialization Error:",
        "Initialization failed"
      );
      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Database service temporarily unavailable.",
      });
    });

    it("should handle PrismaClientUnknownRequestError", () => {
      const error = new PrismaClientUnknownRequestError(
        "Unknown request error",
        { clientVersion: "5.0.0" }
      );

      handleError(error, mockRes);

      expect(consoleMock.error).toHaveBeenCalledWith(
        "Prisma Unknown Error:",
        "Unknown request error"
      );
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "An unexpected database error occurred.",
      });
    });

    it("should handle PrismaClientRustPanicError", () => {
      const error = new PrismaClientRustPanicError(
        "Rust panic occurred",
        "5.0.0"
      );

      handleError(error, mockRes);

      expect(consoleMock.error).toHaveBeenCalledWith(
        "Prisma Rust Panic Error:",
        "Rust panic occurred"
      );
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Critical database error. Please try again later.",
      });
    });
  });

  describe("JWT Errors", () => {
    it("should handle TokenExpiredError", () => {
      const error = new Error("Token expired");
      error.name = "TokenExpiredError";

      handleError(error, mockRes);

      expect(consoleMock.error).toHaveBeenCalledWith(
        "JWT Error:",
        "Token expired"
      );
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Token has expired. Please log in again.",
      });
    });

    it("should handle JsonWebTokenError", () => {
      const error = new Error("Invalid token");
      error.name = "JsonWebTokenError";

      handleError(error, mockRes);

      expect(consoleMock.error).toHaveBeenCalledWith(
        "JWT Error:",
        "Invalid token"
      );
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Invalid token. Please log in again.",
      });
    });

    it("should handle NotBeforeError", () => {
      const error = new Error("Token not active");
      error.name = "NotBeforeError";

      handleError(error, mockRes);

      expect(consoleMock.error).toHaveBeenCalledWith(
        "JWT Error:",
        "Token not active"
      );
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Token not active yet.",
      });
    });
  });

  describe("bcrypt Errors", () => {
    it("should handle bcrypt errors", () => {
      const error = new Error("bcrypt comparison failed");

      handleError(error, mockRes);

      expect(consoleMock.error).toHaveBeenCalledWith(
        "Bcrypt Error:",
        "bcrypt comparison failed"
      );
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Password processing error.",
      });
    });
  });

  describe("Generic Errors", () => {
    it("should handle ECONNREFUSED errors", () => {
      const error = new Error("Connection failed: ECONNREFUSED");

      handleError(error, mockRes);

      expect(consoleMock.error).toHaveBeenCalledWith(
        "Generic Error [Error]:",
        "Connection failed: ECONNREFUSED"
      );
      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Service temporarily unavailable.",
      });
    });

    it("should handle ETIMEDOUT errors", () => {
      const error = new Error("Request ETIMEDOUT");

      handleError(error, mockRes);

      expect(consoleMock.error).toHaveBeenCalledWith(
        "Generic Error [Error]:",
        "Request ETIMEDOUT"
      );
      expect(mockRes.status).toHaveBeenCalledWith(408);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Request timeout. Please try again.",
      });
    });

    it("should handle generic Error objects", () => {
      const error = new Error("Something went wrong");

      handleError(error, mockRes);

      expect(consoleMock.error).toHaveBeenCalledWith(
        "Generic Error [Error]:",
        "Something went wrong"
      );
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Internal server error",
      });
    });

    it("should handle string errors", () => {
      const error = "String error message";

      handleError(error, mockRes);

      expect(consoleMock.error).toHaveBeenCalledWith(
        "String Error:",
        "String error message"
      );
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Internal server error",
      });
    });

    it("should handle completely unknown errors", () => {
      const error = { someProperty: "someValue" };

      handleError(error, mockRes);

      expect(consoleMock.error).toHaveBeenCalledWith("Unknown Error:", error);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Internal server error",
      });
    });

    it("should handle null/undefined errors", () => {
      handleError(null, mockRes);

      expect(consoleMock.error).toHaveBeenCalledWith("Unknown Error:", null);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Internal server error",
      });
    });
  });

  describe("Error Handler Priority", () => {
    it("should prioritize Zod errors over generic errors", () => {
      const zodSchema = z.string().email();

      try {
        zodSchema.parse("invalid-email");
      } catch (error) {
        handleError(error, mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            message: "Validation failed",
          })
        );
      }
    });

    it("should prioritize Prisma known errors over generic errors", () => {
      const error = new PrismaClientKnownRequestError(
        "Unique constraint failed",
        {
          code: "P2002",
          clientVersion: "5.0.0",
          meta: { target: ["email"] },
        }
      );

      handleError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "User with this email already exists.",
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle Prisma errors without meta information", () => {
      const error = new PrismaClientKnownRequestError(
        "Unique constraint failed",
        {
          code: "P2002",
          clientVersion: "5.0.0",
          // No meta property
        }
      );

      handleError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "User with this email already exists.", // Default to email
      });
    });

    it("should handle errors with incomplete meta information", () => {
      const error = new PrismaClientKnownRequestError(
        "Foreign key constraint failed",
        {
          code: "P2003",
          clientVersion: "5.0.0",
          meta: {},
        }
      );

      handleError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Invalid reference: foreign key constraint failed.",
      });
    });
  });
});
