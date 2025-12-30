/* eslint-disable max-lines-per-function*/
/* eslint-disable complexity*/
import { Prisma } from "@prisma/client";
import { MulterError } from "multer";
import { ZodError } from "zod";

import formatPrismaError from "../../utils/prismaErrorFormatter.js";
import { logger } from "../config/logger.js";

import BaseCustomError from "./custom/base.error.js";
import AuthErrorHandler from "./handlers/auth.js";
import DatabaseErrorHandler from "./handlers/database.js";
import FileUploadErrorHandler from "./handlers/fileUpload.js";
import GenericErrorHandler from "./handlers/generic.js";
import ValidationErrorHandler from "./handlers/validation.js";

import type { Request, Response } from "express";

/**
 * Central error handling function for all API controllers.
 *
 * Processes errors from try-catch blocks throughout the application, logs them with context,
 * and returns appropriate HTTP responses. This function acts as the single source of truth
 * for error handling, ensuring consistent error responses across all endpoints.
 *
 * @remarks
 * This function handles multiple error types in order of specificity:
 * - Custom application errors (BaseCustomError and its subclasses)
 * - Validation errors (Zod)
 * - File upload errors (Multer)
 * - Database errors (Prisma client errors)
 * - Authentication errors (JWT and bcrypt)
 * - Generic/unknown errors (fallback)
 *
 * The function also:
 * - Logs errors with contextual information from the request
 * - Formats Prisma errors for better readability
 * - Includes stack traces in development environment
 * - Delegates error handling to specialized handlers for each error type
 *
 * @param {unknown} error - The error caught in the try-catch block. Can be any type of error
 *                          or thrown value (Error, PrismaClientError, ZodError, MulterError, etc.)
 * @param {Request} req - Express Request object used for logging context
 * @param {Response} res - Express Response object used to send the error response back to the client
 *
 * @returns {Response} Express Response object with appropriate status code and error message JSON
 *
 * @example
 * // Usage in error middleware
 * export const errorMiddleware: ErrorRequestHandler = (err, req, res, next) => {
 *   if (res.headersSent) {
 *     return next(err);
 *   }
 *   handleError(err, req, res);
 * };
 *
 * @see {@link BaseCustomError} for custom application errors
 * @see {@link ValidationErrorHandler} for Zod validation error handling
 * @see {@link DatabaseErrorHandler} for Prisma error handling
 * @see {@link AuthErrorHandler} for JWT and bcrypt error handling
 * @see {@link FileUploadErrorHandler} for Multer error handling
 * @see {@link GenericErrorHandler} for fallback error handling
 */
export const handleError = (
  error: unknown,
  req: Request & { logContext?: Record<string, unknown> },
  res: Response
): Response => {
  const contextLogger = logger.child(req.logContext ?? {});

  const errorType =
    error instanceof Error ? error.constructor.name : typeof error;
  const errorMessage =
    error instanceof Prisma.PrismaClientValidationError ||
    error instanceof Prisma.PrismaClientKnownRequestError
      ? formatPrismaError(error)
      : error instanceof Error
      ? error.message
      : String(error);

  contextLogger.error(
    {
      errorType,
      errorDescription: errorMessage,
      stack:
        process.env.NODE_ENV === "development"
          ? error instanceof Error
            ? error.stack
            : undefined
          : undefined,
    },
    `Request failed with error (${errorType})`
  );

  let errorResponse: {
    status: number;
    response: { message: string; errors?: unknown };
  };

  // Handle all custom errors
  if (error instanceof BaseCustomError) {
    errorResponse = {
      status: error.statusCode,
      response: { message: error.message },
    };
  }
  // Handle Zod validation errors
  else if (error instanceof ZodError) {
    errorResponse = ValidationErrorHandler.handleValidationError(error);
  }
  // Handle Multer file upload errors
  else if (error instanceof MulterError) {
    errorResponse = FileUploadErrorHandler.handleMulterError(error);
  }
  // Handle Prisma errors (in order of specificity)
  else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    errorResponse = DatabaseErrorHandler.handlePrismaKnownError(error);
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    errorResponse = DatabaseErrorHandler.handlePrismaValidationError(error);
  } else if (error instanceof Prisma.PrismaClientInitializationError) {
    errorResponse = DatabaseErrorHandler.handlePrismaInitializationError(error);
  } else if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    errorResponse = DatabaseErrorHandler.handlePrismaUnknownError(error);
  } else if (error instanceof Prisma.PrismaClientRustPanicError) {
    errorResponse = DatabaseErrorHandler.handlePrismaRustPanicError(error);
  }
  // Handle JWT-related errors
  else if (
    error instanceof Error &&
    (error.name === "TokenExpiredError" ||
      error.name === "JsonWebTokenError" ||
      error.name === "NotBeforeError")
  ) {
    errorResponse = AuthErrorHandler.handleJWTError(error);
  }
  // Handle bcrypt errors
  else if (error instanceof Error && error.message.includes("bcrypt")) {
    errorResponse = AuthErrorHandler.handleBcryptError(error);
  }
  // Handle all other errors
  else {
    errorResponse = GenericErrorHandler.handleGenericError(error);
  }

  return res.status(errorResponse.status).json(errorResponse.response);
};
