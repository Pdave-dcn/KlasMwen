import { createLogger } from "../core/config/logger.js";
import ReactionService from "../features/reaction/service/ReactionService.js";
import createActionLogger from "../utils/logger.util.js";
import { PostIdParamSchema } from "../zodSchemas/post.zod.js";

import type { AuthenticatedRequest } from "../types/AuthRequest.js";
import type { Request, Response, NextFunction } from "express";

const controllerLogger = createLogger({ module: "reactionController" });

const toggleLike = async (req: Request, res: Response, next: NextFunction) => {
  const actionLogger = createActionLogger(controllerLogger, "toggleLike", req);

  try {
    actionLogger.info("Like toggle attempt started");
    const startTime = Date.now();

    const { user } = req as AuthenticatedRequest;
    const { id: postId } = PostIdParamSchema.parse(req.params);

    const result = await ReactionService.toggleLike(user.id, postId, req.app);

    const totalDuration = Date.now() - startTime;
    actionLogger.info(
      {
        userId: user.id,
        postId,
        action: result.action,
        totalDuration,
      },
      result.message
    );

    return res.status(200).json({
      message: result.message,
    });
  } catch (error: unknown) {
    return next(error);
  }
};

export { toggleLike };
