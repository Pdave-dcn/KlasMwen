import { createLogger } from "../../core/config/logger.js";
import { postService } from "../../features/posts/service/PostService.js";
import { withLogging } from "../../utils/logger.util.js";
import {
  PostIdParamSchema,
  UpdatedPostSchema,
} from "../../zodSchemas/post.zod.js";

import type { AuthenticatedRequest } from "../../types/AuthRequest.js";

const controllerLogger = createLogger({ module: "PostController" });

const updatePost = withLogging<AuthenticatedRequest>(
  controllerLogger, "updatePost",
  async ({ req, res, log }) => {
    log.info("Post update attempt started");

    const { id: postId } = PostIdParamSchema.parse(req.params);

    const validatedData = UpdatedPostSchema.parse({
      title: req.body.title,
      type: req.body.type,
      tagIds: req.body.tagIds,
      ...(req.body.content !== undefined && { content: req.body.content }),
      ...(req.body.fileName !== undefined && { fileName: req.body.fileName }),
    });

    log.debug("Executing post update");
    const result = await postService.command.updatePost(
      validatedData,
      postId,
      req.user,
    );

    log.info(
      {
        postId: result.id,
        userId: req.user.id,
      },
      "Post updated successfully",
    );

    res.status(200).json({
      message: "Post updated successfully",
      data: result,
    });
  },
);

export { updatePost };
