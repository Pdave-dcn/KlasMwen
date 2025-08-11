/* eslint-disable max-lines-per-function */

import type { MulterError } from "multer";

class FileUploadErrorHandler {
  // Handle Multer file upload errors
  static handleMulterError(error: MulterError) {
    console.error("Multer Error:", error.message);

    switch (error.code) {
      // File size limit exceeded
      case "LIMIT_FILE_SIZE": {
        return {
          status: 413,
          response: {
            message: `File too large. Maximum file size is ${
              error.field ? `allowed for field '${error.field}'` : "exceeded"
            }.`,
            code: "FILE_TOO_LARGE",
          },
        };
      }

      // Too many files uploaded
      case "LIMIT_FILE_COUNT": {
        return {
          status: 400,
          response: {
            message:
              "Too many files uploaded. Please reduce the number of files.",
            code: "TOO_MANY_FILES",
          },
        };
      }

      // Too many parts in multipart form
      case "LIMIT_PART_COUNT": {
        return {
          status: 400,
          response: {
            message:
              "Too many form fields. Please reduce the number of fields.",
            code: "TOO_MANY_PARTS",
          },
        };
      }

      // Field name too long
      case "LIMIT_FIELD_KEY": {
        return {
          status: 400,
          response: {
            message: "Field name too long. Please use shorter field names.",
            code: "FIELD_NAME_TOO_LONG",
          },
        };
      }

      // Field value too long
      case "LIMIT_FIELD_VALUE": {
        return {
          status: 400,
          response: {
            message: `Field value too long${
              error.field ? ` for field '${error.field}'` : ""
            }.`,
            code: "FIELD_VALUE_TOO_LONG",
          },
        };
      }

      // Too many fields
      case "LIMIT_FIELD_COUNT": {
        return {
          status: 400,
          response: {
            message:
              "Too many fields. Please reduce the number of form fields.",
            code: "TOO_MANY_FIELDS",
          },
        };
      }

      // Unexpected field (file uploaded to unexpected field name)
      case "LIMIT_UNEXPECTED_FILE": {
        return {
          status: 400,
          response: {
            message: `Unexpected file upload${
              error.field ? ` in field '${error.field}'` : ""
            }. Please check the field name.`,
            code: "UNEXPECTED_FILE_FIELD",
          },
        };
      }

      // Missing required file
      case "MISSING_FIELD_NAME": {
        return {
          status: 400,
          response: {
            message: "Missing field name for file upload.",
            code: "MISSING_FIELD_NAME",
          },
        };
      }

      // Default case for unhandled Multer errors
      default: {
        console.error(`Unhandled Multer Error:`, error.message);
        return {
          status: 400,
          response: {
            message: "File upload error. Please try again.",
            code: "FILE_UPLOAD_ERROR",
          },
        };
      }
    }
  }
}

export default FileUploadErrorHandler;
