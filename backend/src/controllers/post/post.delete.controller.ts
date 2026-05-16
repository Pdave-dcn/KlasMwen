import { createLogger } from "../../core/config/logger.js";
import { postService } from "../../features/posts/service/PostService.js";
import { withLogging } from "../../utils/logger.util.js";
import { PostIdParamSchema } from "../../zodSchemas/post.zod.js";

import type { AuthenticatedRequest } from "../../types/AuthRequest.js";

const controllerLogger = createLogger({ module: "PostController" });

const deletePost = withLogging<AuthenticatedRequest>(
  controllerLogger, "deletePost",
  async ({ req, res, log }) => {
    log.info("Post deletion attempt started");

    const { id: postId } = PostIdParamSchema.parse(req.params);

    log.debug("Processing post deletion");
    await postService.command.deletePost(postId, req.user);

    log.info(
      {
        postId,
        username: req.user.username,
      },
      "Post deleted successfully",
    );

    res.status(200).json({ message: "Post deleted successfully" });
  },
);

export { deletePost };
