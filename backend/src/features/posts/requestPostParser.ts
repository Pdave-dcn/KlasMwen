import FileUploadError from "../../core/error/custom/file.error.js";
import {
  CompletePostSchema,
  NewPostRequestSchema,
} from "../../zodSchemas/post.zod.js";
import { uploadToCloudinary } from "../media/cloudinaryServices.js";

import type {
  CreatePostInput,
  ResourcePostInput,
  TextPostInput,
} from "../../types/postTypes.js";
import type { Request } from "express";

interface FileUploadData {
  uploadedFileInfo: {
    publicId: string;
    secureUrl: string;
  } | null;
  completeValidatedData: CreatePostInput;
}

/**
 * Processes post creation requests with validation and optional file upload.
 * Handles both text posts (with content) and resource posts (with files).
 *
 * @param {Request} req - Express request with form data and optional file
 * @param {string} userId - User ID for file organization
 * @returns {Promise<FileUploadData>} Validated data with optional file info
 * @throws {FileUploadError} On validation or upload failures
 */
const handleRequestValidation = async (
  req: Request,
  userId: string
): Promise<FileUploadData> => {
  let parsedTagIds: number[] = [];

  if (typeof req.body.tagIds === "string") {
    try {
      parsedTagIds = JSON.parse(req.body.tagIds);
    } catch {
      parsedTagIds = [];
    }
  } else if (Array.isArray(req.body.tagIds)) {
    parsedTagIds = req.body.tagIds;
  }

  const bodyValidation = NewPostRequestSchema.parse({
    title: req.body.title,
    type: req.body.type,
    tagIds: parsedTagIds,
    ...(req.body.content && { content: req.body.content }),
  });

  // Handle resource posts
  if (bodyValidation.type === "RESOURCE") {
    if (!req.file) {
      throw new FileUploadError("File is required for resource posts", 400);
    }

    try {
      const cloudinaryResult = await uploadToCloudinary(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        userId
      );

      // Create complete resource data and validate
      const completeValidatedData = CompletePostSchema.parse({
        ...bodyValidation,
        fileUrl: cloudinaryResult.secureUrl,
        fileName: req.file.originalname,
        fileSize: cloudinaryResult.bytes,
        mimeType: req.file.mimetype,
      });

      return {
        uploadedFileInfo: {
          publicId: cloudinaryResult.publicId,
          secureUrl: cloudinaryResult.secureUrl,
        },
        completeValidatedData: completeValidatedData as ResourcePostInput,
      };
    } catch (uploadError) {
      console.error("File upload to Cloudinary failed:", uploadError);
      throw new FileUploadError("File upload failed. Please try again.", 500);
    }
  } else {
    return {
      uploadedFileInfo: null,
      completeValidatedData: bodyValidation as TextPostInput,
    };
  }
};

export default handleRequestValidation;
