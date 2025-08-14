import {
  PrismaClientInitializationError,
  PrismaClientKnownRequestError,
  PrismaClientRustPanicError,
  PrismaClientUnknownRequestError,
  PrismaClientValidationError,
} from "@prisma/client/runtime/library";
import { MulterError } from "multer";
import { ZodError } from "zod";

import BaseCustomError from "./custom/base.error.js";
import AuthErrorHandler from "./handlers/auth";
import DatabaseErrorHandler from "./handlers/database";
import FileUploadErrorHandler from "./handlers/fileUpload";
import GenericErrorHandler from "./handlers/generic";
import ValidationErrorHandler from "./handlers/validation";

import type { Response } from "express";

export const handleError = (error: unknown, res: Response): Response => {
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
  else if (error instanceof PrismaClientKnownRequestError) {
    errorResponse = DatabaseErrorHandler.handlePrismaKnownError(error);
  } else if (error instanceof PrismaClientValidationError) {
    errorResponse = DatabaseErrorHandler.handlePrismaValidationError(error);
  } else if (error instanceof PrismaClientInitializationError) {
    errorResponse = DatabaseErrorHandler.handlePrismaInitializationError(error);
  } else if (error instanceof PrismaClientUnknownRequestError) {
    errorResponse = DatabaseErrorHandler.handlePrismaUnknownError(error);
  } else if (error instanceof PrismaClientRustPanicError) {
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
