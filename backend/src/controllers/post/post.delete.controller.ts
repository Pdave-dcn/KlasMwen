/* eslint-disable max-lines-per-function*/
import prisma from "../../core/config/db";
import { createLogger } from "../../core/config/logger";
import { handleError } from "../../core/error";
import {
  deleteFromCloudinary,
  extractPublicIdFromUrl,
} from "../../features/media/cloudinaryServices";
import { checkPermission, ensureAuthenticated } from "../../utils/auth.util";
import createActionLogger from "../../utils/logger.util";
import { PostIdParamSchema } from "../../zodSchemas/post.zod";

import type { Request, Response } from "express";

const controllerLogger = createLogger({ module: "PostController" });

// todo: refactor this function (too long)
const deletePost = async (req: Request, res: Response) => {
  const actionLogger = createActionLogger(controllerLogger, "deletePost", req);

  try {
    actionLogger.info("Post deletion attempt started");
    const startTime = Date.now();

    const user = ensureAuthenticated(req);
    actionLogger.info(
      { userId: user.id, username: user.username },
      "User authenticated for post deletion"
    );

    const { id: postId } = PostIdParamSchema.parse(req.params);
    actionLogger.debug({ postId }, "Post ID parameter parsed");

    actionLogger.debug("Fetching post for deletion");
    const dbLookupStartTime = Date.now();
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });
    const dbLookupDuration = Date.now() - dbLookupStartTime;

    if (!post) {
      actionLogger.warn(
        { postId, userId: user.id, dbLookupDuration },
        "Post not found for deletion"
      );
      return res.status(404).json({ message: "Post not found" });
    }

    actionLogger.info(
      {
        postId: post.id,
        postType: post.type,
        postAuthorId: post.authorId,
        requestUserId: user.id,
        hasFile: !!post.fileUrl,
        fileName: post.fileName,
        dbLookupDuration,
      },
      "Post found, checking permissions"
    );

    checkPermission(user, post);
    actionLogger.debug("Permission check passed");

    // Handle file cleanup if it's a RESOURCE post with a file
    let cleanupDuration = 0;
    if (post.type === "RESOURCE" && post.fileUrl) {
      actionLogger.debug(
        { fileUrl: post.fileUrl, fileName: post.fileName },
        "Resource post with file detected, initiating cleanup"
      );

      const cleanupStartTime = Date.now();
      try {
        const publicId = extractPublicIdFromUrl(post.fileUrl);
        if (publicId) {
          actionLogger.debug(
            { publicId },
            "Extracted public ID, deleting from Cloudinary"
          );
          await deleteFromCloudinary(publicId, "raw");
          cleanupDuration = Date.now() - cleanupStartTime;
          actionLogger.info(
            { publicId, fileName: post.fileName, cleanupDuration },
            "File deleted from Cloudinary successfully"
          );
        } else {
          actionLogger.warn(
            { fileUrl: post.fileUrl },
            "Could not extract public ID from file URL"
          );
        }
      } catch (cleanupError) {
        cleanupDuration = Date.now() - cleanupStartTime;
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
            fileUrl: post.fileUrl,
            fileName: post.fileName,
            cleanupDuration,
          },
          "Failed to cleanup Cloudinary file - continuing with post deletion"
        );
      }
    }

    actionLogger.debug("Deleting post from database");
    const dbDeleteStartTime = Date.now();
    await prisma.post.delete({
      where: { id: postId },
    });
    const dbDeleteDuration = Date.now() - dbDeleteStartTime;

    const totalDuration = Date.now() - startTime;
    actionLogger.info(
      {
        postId,
        postType: post.type,
        userId: user.id,
        username: user.username,
        hadFile: !!post.fileUrl,
        fileName: post.fileName,
        dbLookupDuration,
        cleanupDuration,
        dbDeleteDuration,
        totalDuration,
      },
      "Post deleted successfully"
    );

    return res.status(200).json({ message: "Post deleted successfully" });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

export { deletePost };
