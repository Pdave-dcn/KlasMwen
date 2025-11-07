import { createLogger } from "../../core/config/logger";
import { handleError } from "../../core/error";
import PostService from "../../features/posts/service/PostService";
import { ensureAuthenticated } from "../../utils/auth.util";
import createActionLogger from "../../utils/logger.util";
import { PostIdParamSchema } from "../../zodSchemas/post.zod";

import type { Request, Response } from "express";

const controllerLogger = createLogger({ module: "PostController" });

const deletePost = async (req: Request, res: Response) => {
  const actionLogger = createActionLogger(controllerLogger, "deletePost", req);

  try {
    actionLogger.info("Post deletion attempt started");
    const startTime = Date.now();

    const user = ensureAuthenticated(req);
    const { id: postId } = PostIdParamSchema.parse(req.params);
    actionLogger.info("User authenticated and post ID validated");

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
    return handleError(error, res);
  }
};

export { deletePost };
