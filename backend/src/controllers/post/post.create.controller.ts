import { createLogger } from "../../core/config/logger.js";
import { postService } from "../../features/posts/service/PostService.js";
import handleRequestValidation from "../../features/posts/service/requestPostParser.js";
import { withLogging } from "../../utils/logger.util.js";

import type { AuthenticatedRequest } from "../../types/AuthRequest.js";

const controllerLogger = createLogger({ module: "PostController" });

const createPost = withLogging<AuthenticatedRequest>(
  controllerLogger, "createPost",
  async ({ req, res, log }) => {
    log.info("Post creation attempt started");

    const { completeValidatedData, uploadedFileInfo } =
      await handleRequestValidation(req, req.user.id);

    log.debug("Processing post creation");
    const result = await postService.command.createPost(
      completeValidatedData,
      req.user.id,
      uploadedFileInfo,
    );
    if (!result) return;

    log.info(
      {
        postId: result.id,
        postType: result.type,
        username: req.user.username,
        hasFile: !!uploadedFileInfo,
        tagCount: completeValidatedData.tagIds?.length || 0,
      },
      "Post created successfully",
    );

    res.status(201).json({
      message: "Post created successfully",
      data: result,
    });
  },
);

export { createPost };
