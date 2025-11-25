import { createLogger } from "../../core/config/logger.js";
import { handleError } from "../../core/error/index.js";
import handleRequestValidation from "../../features/posts/requestPostParser.js";
import PostService from "../../features/posts/service/PostService.js";
import { ensureAuthenticated } from "../../utils/auth.util.js";
import createActionLogger from "../../utils/logger.util.js";

import type { Request, Response } from "express";

const controllerLogger = createLogger({ module: "PostController" });

const createPost = async (req: Request, res: Response) => {
  const actionLogger = createActionLogger(controllerLogger, "createPost", req);

  try {
    actionLogger.info("Post creation attempt started");
    const startTime = Date.now();

    const user = ensureAuthenticated(req);
    const { completeValidatedData, uploadedFileInfo } =
      await handleRequestValidation(req, user.id);
    actionLogger.info("User authenticated and post data validated");

    actionLogger.debug("Processing post creation");
    const serviceStartTime = Date.now();
    const result = await PostService.createPost(
      completeValidatedData,
      user.id,
      uploadedFileInfo
    );
    if (!result) return;
    const serviceDuration = Date.now() - serviceStartTime;

    const totalDuration = Date.now() - startTime;

    actionLogger.info(
      {
        postId: result.id,
        postType: result.type,
        username: user.username,
        hasFile: !!uploadedFileInfo,
        tagCount: completeValidatedData.tagIds?.length || 0,
        serviceDuration,
        totalDuration,
      },
      "Post created successfully"
    );

    return res.status(201).json({
      message: "Post created successfully",
      data: result,
    });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

export { createPost };
