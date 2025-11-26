import { createLogger } from "../../core/config/logger.js";
import { handleError } from "../../core/error/index.js";
import PostService from "../../features/posts/service/PostService.js";
import { ensureAuthenticated } from "../../utils/auth.util.js";
import createActionLogger from "../../utils/logger.util.js";
import {
  PostIdParamSchema,
  UpdatedPostSchema,
} from "../../zodSchemas/post.zod.js";

import type { Request, Response } from "express";

const controllerLogger = createLogger({ module: "PostController" });

const updatePost = async (req: Request, res: Response) => {
  const actionLogger = createActionLogger(controllerLogger, "updatePost", req);
  try {
    actionLogger.info("Post update attempt started");
    const startTime = Date.now();

    const user = ensureAuthenticated(req);
    const { id: postId } = PostIdParamSchema.parse(req.params);

    actionLogger.info(
      { userId: user.id, username: user.username, postId },
      "User authenticated and post ID parsed"
    );

    const validatedData = UpdatedPostSchema.parse({
      title: req.body.title,
      type: req.body.type,
      tagIds: req.body.tagIds,
      ...(req.body.content !== undefined && { content: req.body.content }),
      ...(req.body.fileName !== undefined && { fileName: req.body.fileName }),
    });
    actionLogger.info("Post update data validated");

    actionLogger.debug("Executing post update");
    const serviceStartTime = Date.now();
    const result = await PostService.updatePost(validatedData, postId, user);
    if (!result) return;
    const serviceDuration = Date.now() - serviceStartTime;

    const totalDuration = Date.now() - startTime;

    actionLogger.info(
      {
        postId: result.id,
        userId: user.id,
        serviceDuration,
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
