/* eslint-disable max-lines-per-function*/
import prisma from "../../core/config/db";
import { createLogger } from "../../core/config/logger";
import { handleError } from "../../core/error";
import PostService from "../../features/posts/service/PostService";
import { ensureAuthenticated, checkPermission } from "../../utils/auth.util";
import createActionLogger from "../../utils/logger.util";
import {
  PostIdParamSchema,
  UpdatedPostSchema,
} from "../../zodSchemas/post.zod";

import type { Request, Response } from "express";

const controllerLogger = createLogger({ module: "PostController" });

// todo: refactor this function (too long)
const updatePost = async (req: Request, res: Response) => {
  const actionLogger = createActionLogger(controllerLogger, "updatePost", req);
  try {
    actionLogger.info("Post update attempt started");
    const startTime = Date.now();

    const user = ensureAuthenticated(req);
    actionLogger.info(
      { userId: user.id, username: user.username },
      "User authenticated for post update"
    );

    const { id: postId } = PostIdParamSchema.parse(req.params);
    actionLogger.debug({ postId }, "Post ID parameter parsed");

    const validatedData = UpdatedPostSchema.parse({
      title: req.body.title,
      type: req.body.type,
      tagIds: req.body.tagIds,
      ...(req.body.content !== undefined && { content: req.body.content }),
      ...(req.body.fileName !== undefined && { fileName: req.body.fileName }),
    });

    actionLogger.info(
      {
        postId,
        postType: validatedData.type,
        tagCount: validatedData.tagIds?.length || 0,
      },
      "Update data validated"
    );

    actionLogger.debug("Fetching post for update");
    const dbLookupStartTime = Date.now();
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });
    const dbLookupDuration = Date.now() - dbLookupStartTime;

    if (!post) {
      actionLogger.warn(
        { postId, userId: user.id, dbLookupDuration },
        "Post not found for update"
      );
      return res.status(404).json({ message: "Post not found" });
    }

    actionLogger.info(
      {
        postId: post.id,
        postAuthorId: post.authorId,
        requestUserId: user.id,
        dbLookupDuration,
      },
      "Post found, checking permissions"
    );

    checkPermission(user, post, false);
    actionLogger.debug("Permission check passed");

    actionLogger.debug("Executing post update");
    const dbUpdateStartTime = Date.now();
    const result = await PostService.handlePostUpdate(validatedData, post.id);
    const dbUpdateDuration = Date.now() - dbUpdateStartTime;

    if (!result) {
      const totalDuration = Date.now() - startTime;
      actionLogger.error(
        {
          postId,
          userId: user.id,
          dbLookupDuration,
          dbUpdateDuration,
          totalDuration,
        },
        "Post update failed - update handler returned null"
      );
      return res
        .status(400)
        .json({ message: "Unexpected error: post update failed." });
    }
    const totalDuration = Date.now() - startTime;

    actionLogger.info(
      {
        postId: result.id,
        userId: user.id,
        username: user.username,
        postType: validatedData.type,
        tagCount: validatedData.tagIds?.length || 0,
        dbLookupDuration,
        dbUpdateDuration,
        totalDuration,
      },
      "Post updated successfully"
    );

    return res.status(200).json({
      message: "Post updated successfully",
      data: result,
    });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

export { updatePost };
