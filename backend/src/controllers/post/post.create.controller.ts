import { createLogger } from "../../core/config/logger.js";
import handleRequestValidation from "../../features/posts/requestPostParser.js";
import PostService from "../../features/posts/service/PostService.js";
import createActionLogger from "../../utils/logger.util.js";

import type { AuthenticatedRequest } from "../../types/AuthRequest.js";
import type { Request, Response, NextFunction} from "express";

const controllerLogger = createLogger({ module: "PostController" });

const createPost = async (req: Request, res: Response, next: NextFunction) => {
  const actionLogger = createActionLogger(controllerLogger, "createPost", req);

  try {
    actionLogger.info("Post creation attempt started");
    const startTime = Date.now();

    const { user } = req as AuthenticatedRequest;

    const { completeValidatedData, uploadedFileInfo } =
      await handleRequestValidation(req, user.id);

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
    return next(error);
  }
};

export { createPost };
