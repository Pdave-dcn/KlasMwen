/* eslint-disable max-lines-per-function*/
/* eslint-disable complexity*/
import { Prisma } from "@prisma/client";
import { MulterError } from "multer";
import { ZodError } from "zod";

import { logger } from "../config/logger.js";

import BaseCustomError from "./custom/base.error.js";
import AuthErrorHandler from "./handlers/auth.js";
import DatabaseErrorHandler from "./handlers/database.js";
import FileUploadErrorHandler from "./handlers/fileUpload.js";
import GenericErrorHandler from "./handlers/generic.js";
import ValidationErrorHandler from "./handlers/validation.js";

import type { Request, Response } from "express";

export const handleError = (error: unknown, res: Response): Response => {
  const req = res.req as
    | (Request & { logContext?: Record<string, unknown> })
    | undefined;
  const contextLogger = logger.child(req?.logContext ?? {});

  const errorType =
    error instanceof Error ? error.constructor.name : typeof error;
  const errorMessage = error instanceof Error ? error.message : String(error);

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

  let errorResponse;

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
