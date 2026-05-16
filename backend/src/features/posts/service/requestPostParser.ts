import FileUploadError from "../../../core/error/custom/file.error.js";
import {
  CompletePostSchema,
  NewPostRequestSchema,
} from "../../../zodSchemas/post.zod.js";
import CloudinaryService from "../../media/CloudinaryService.js";

import type {
  CreatePostInput,
  ResourcePostInput,
  TextPostInput,
} from "./types/postTypes.js";
import type { Request } from "express";

interface FileUploadData {
  uploadedFileInfo: {
    publicId: string;
    secureUrl: string;
  } | null;
  completeValidatedData: CreatePostInput;
}

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

  if (bodyValidation.type === "RESOURCE") {
    if (!req.file) {
      throw new FileUploadError("File is required for resource posts", 400);
    }

    try {
      const cloudinaryResult = await CloudinaryService.upload(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        userId
      );

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
