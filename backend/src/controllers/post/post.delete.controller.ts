import { createLogger } from "../../core/config/logger.js";
import PostService from "../../features/posts/service/PostService.js";
import createActionLogger from "../../utils/logger.util.js";
import { PostIdParamSchema } from "../../zodSchemas/post.zod.js";

import type { AuthenticatedRequest } from "../../types/AuthRequest.js";
import type { Request, Response, NextFunction} from "express";

const controllerLogger = createLogger({ module: "PostController" });

const deletePost = async (req: Request, res: Response, next: NextFunction) => {
  const actionLogger = createActionLogger(controllerLogger, "deletePost", req);

  try {
    actionLogger.info("Post deletion attempt started");
    const startTime = Date.now();

    const { user } = req as AuthenticatedRequest;

    const { id: postId } = PostIdParamSchema.parse(req.params);

    actionLogger.debug("Processing post deletion");
    const serviceStartTime = Date.now();
    await PostService.deletePost(postId, user);
    const serviceDuration = Date.now() - serviceStartTime;

    const totalDuration = Date.now() - startTime;
    actionLogger.info(
      {
        postId,
        username: user.username,
        serviceDuration,
        totalDuration,
      },
      "Post deleted successfully"
    );

    return res.status(200).json({ message: "Post deleted successfully" });
  } catch (error: unknown) {
    return next(error);
  }
};

export { deletePost };
