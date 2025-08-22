/* eslint-disable max-lines-per-function*/
import prisma from "../core/config/db.js";
import { createLogger } from "../core/config/logger.js";
import { handleError } from "../core/error/index";
import { ensureAuthenticated } from "../utils/auth.util.js";
import createActionLogger from "../utils/logger.util.js";
import { PostIdParamSchema } from "../zodSchemas/post.zod.js";

import type { Request, Response } from "express";

const controllerLogger = createLogger({ module: "reactionController" });

const toggleLike = async (req: Request, res: Response) => {
  const actionLogger = createActionLogger(controllerLogger, "toggleLike", req);

  try {
    actionLogger.info("Like toggle attempt started");
    const startTime = Date.now();

    actionLogger.debug("Authenticating user");
    const authStartTime = Date.now();
    const user = ensureAuthenticated(req);
    const userId = user.id;
    const authDuration = Date.now() - authStartTime;

    actionLogger.debug("Validating post ID parameter");
    const validationStartTime = Date.now();
    const { id: postId } = PostIdParamSchema.parse(req.params);
    const validationDuration = Date.now() - validationStartTime;

    actionLogger.info(
      {
        userId,
        postId,
        authDuration,
        validationDuration,
      },
      "User authenticated and post ID validated"
    );

    actionLogger.debug("Checking post existence and current like status");
    const dbCheckStartTime = Date.now();
    const [existingPost, existingLike] = await Promise.all([
      prisma.post.findUnique({ where: { id: postId } }),
      prisma.like.findUnique({
        where: { userId_postId: { userId, postId } },
      }),
    ]);
    const dbCheckDuration = Date.now() - dbCheckStartTime;

    actionLogger.info(
      {
        postExists: !!existingPost,
        alreadyLiked: !!existingLike,
        dbCheckDuration,
      },
      "Post and like status check completed"
    );

    if (!existingPost) {
      const totalDuration = Date.now() - startTime;
      actionLogger.warn(
        {
          postId,
          userId,
          authDuration,
          validationDuration,
          dbCheckDuration,
          totalDuration,
        },
        "Like toggle failed - post not found"
      );
      return res
        .status(404)
        .json({ message: "The post being reacted to is not found" });
    }

    let action: "unlike" | "like";
    let dbOperationDuration: number;

    if (existingLike) {
      actionLogger.debug("Removing existing like");
      const unlikeStartTime = Date.now();
      await prisma.like.delete({
        where: { userId_postId: { userId, postId } },
      });
      dbOperationDuration = Date.now() - unlikeStartTime;
      action = "unlike";

      const totalDuration = Date.now() - startTime;
      actionLogger.info(
        {
          userId,
          postId,
          action,
          authDuration,
          validationDuration,
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

    actionLogger.debug("Creating new like");
    const likeStartTime = Date.now();
    await prisma.like.create({
      data: { userId, postId },
    });
    dbOperationDuration = Date.now() - likeStartTime;
    action = "like";

    const totalDuration = Date.now() - startTime;
    actionLogger.info(
      {
        userId,
        postId,
        action,
        authDuration,
        validationDuration,
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
