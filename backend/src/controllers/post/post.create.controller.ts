/* eslint-disable max-lines-per-function*/
import { createLogger } from "../../core/config/logger";
import { handleError } from "../../core/error";
import { deleteFromCloudinary } from "../../features/media/cloudinaryServices";
import handlePostCreation from "../../features/posts/postCreationHandler";
import transformPostTagsToFlat from "../../features/posts/postTagFlattener";
import handleRequestValidation from "../../features/posts/requestPostParser";
import { ensureAuthenticated } from "../../utils/auth.util";
import createActionLogger from "../../utils/logger.util";

import type { RawPost } from "../../types/postTypes";
import type { Request, Response } from "express";

const controllerLogger = createLogger({ module: "PostController" });

const createPost = async (req: Request, res: Response) => {
  const actionLogger = createActionLogger(controllerLogger, "createPost", req);

  try {
    actionLogger.info("Post creation attempt started");
    const startTime = Date.now();

    const user = ensureAuthenticated(req);
    actionLogger.info(
      { userId: user.id, username: user.username },
      "User authenticated for post creation"
    );

    actionLogger.debug("Validating request and processing file upload");
    const validationStartTime = Date.now();
    const { completeValidatedData, uploadedFileInfo } =
      await handleRequestValidation(req, user.id);
    const validationDuration = Date.now() - validationStartTime;

    actionLogger.info(
      {
        postType: completeValidatedData.type,
        hasFile: !!uploadedFileInfo,
        tagCount: completeValidatedData.tagIds?.length || 0,
        validationDuration,
      },
      "Request validation completed"
    );

    actionLogger.debug("Creating post in database");
    const dbStartTime = Date.now();
    const result = await handlePostCreation(completeValidatedData, user.id);
    const dbDuration = Date.now() - dbStartTime;

    if (!result) {
      // If database operation failed but file was uploaded, clean up
      if (uploadedFileInfo) {
        actionLogger.warn(
          {
            publicId: uploadedFileInfo.publicId,
          },
          "Post creation failed, cleaning up uploaded file"
        );
        try {
          await deleteFromCloudinary(uploadedFileInfo.publicId, "raw");
          actionLogger.info("Cleanup of uploaded file completed");
        } catch (cleanupError) {
          actionLogger.error(
            {
              errorType:
                cleanupError instanceof Error
                  ? cleanupError.constructor.name
                  : typeof cleanupError,
              errorDescription:
                cleanupError instanceof Error
                  ? cleanupError.message
                  : String(cleanupError),
              filePublicId: uploadedFileInfo.publicId,
            },
            "Failed to cleanup uploaded file"
          );
        }
      }

      const totalDuration = Date.now() - startTime;
      actionLogger.error(
        { dbDuration, totalDuration },
        "Post creation failed - database operation returned null"
      );

      return res
        .status(500)
        .json({ message: "Unexpected error: post creation failed." });
    }

    const transformedPost = transformPostTagsToFlat(result as RawPost);
    const totalDuration = Date.now() - startTime;

    actionLogger.info(
      {
        postId: result.id,
        postType: result.type,
        userId: user.id,
        username: user.username,
        hasFile: !!uploadedFileInfo,
        tagCount: completeValidatedData.tagIds?.length || 0,
        dbDuration,
        totalDuration,
      },
      "Post created successfully"
    );

    return res.status(201).json({
      message: "Post created successfully",
      data: transformedPost,
    });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

export { createPost };
