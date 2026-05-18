import { createLogger } from "../core/config/logger.js";
import { reactionService } from "../features/reaction/service/index.js";
import { withLogging } from "../utils/logger.util.js";
import { PostIdParamSchema } from "../zodSchemas/post.zod.js";

import type { AuthenticatedRequest } from "../types/AuthRequest.js";

const controllerLogger = createLogger({ module: "reactionController" });

const toggleLike = withLogging<AuthenticatedRequest>(
  controllerLogger,
  "toggleLike",
  async ({ req, res, log }) => {
    log.info("Received request to toggle like");
    const { id: postId } = PostIdParamSchema.parse(req.params);
    const result = await reactionService.toggleLike(
      req.user.id,
      postId,
      req.app,
    );
    res.status(200).json({ message: result.message });
  },
);

export { toggleLike };
