/* eslint-disable max-lines-per-function*/
import prisma from "../core/config/db.js";
import { createLogger } from "../core/config/logger.js";
import { handleError } from "../core/error/index.js";
import PostService from "../features/posts/service/PostService.js";
import createActionLogger from "../utils/logger.util.js";
import { PostIdParamSchema } from "../zodSchemas/post.zod.js";

import type { AuthenticatedRequest } from "../types/AuthRequest.js";
import type { Request, Response } from "express";

const controllerLogger = createLogger({ module: "reactionController" });

const toggleLike = async (req: Request, res: Response) => {
  const actionLogger = createActionLogger(controllerLogger, "toggleLike", req);

  try {
    actionLogger.info("Like toggle attempt started");
    const startTime = Date.now();

    const { user } = req as AuthenticatedRequest;
    const { id: postId } = PostIdParamSchema.parse(req.params);

    const dbCheckStartTime = Date.now();
    const [_existingPost, existingLike] = await Promise.all([
      PostService.verifyPostExists(postId),
      prisma.like.findUnique({
        where: { userId_postId: { userId: user.id, postId } },
      }),
    ]);
    const dbCheckDuration = Date.now() - dbCheckStartTime;

    let action: "unlike" | "like";
    let dbOperationDuration: number;

    if (existingLike) {
      const unlikeStartTime = Date.now();
      await prisma.like.delete({
        where: { userId_postId: { userId: user.id, postId } },
      });
      dbOperationDuration = Date.now() - unlikeStartTime;
      action = "unlike";

      const totalDuration = Date.now() - startTime;
      actionLogger.info(
        {
          userId: user.id,
          postId,
          action,
          dbCheckDuration,
          dbOperationDuration,
          totalDuration,
        },
        "Post unliked successfully"
      );

      return res.status(200).json({
        message: "Post unliked successfully",
      });
    }

    const likeStartTime = Date.now();
    await prisma.like.create({
      data: { userId: user.id, postId },
    });
    dbOperationDuration = Date.now() - likeStartTime;
    action = "like";

    const totalDuration = Date.now() - startTime;
    actionLogger.info(
      {
        userId: user.id,
        postId,
        action,
        dbCheckDuration,
        dbOperationDuration,
        totalDuration,
      },
      "Post liked successfully"
    );

    return res.status(200).json({
      message: "Post liked successfully",
    });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

export { toggleLike };
