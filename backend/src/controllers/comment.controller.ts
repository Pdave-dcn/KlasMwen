import { createLogger } from "../core/config/logger.js";
import { handleError } from "../core/error/index";
import CommentService from "../features/comments/service/CommentService";
import { ensureAuthenticated } from "../utils/auth.util";
import createActionLogger from "../utils/logger.util.js";
import { createPaginationSchema } from "../utils/pagination.util";
import {
  CommentIdParamSchema,
  CreateCommentSchema,
} from "../zodSchemas/comment.zod";
import { PostIdParamSchema } from "../zodSchemas/post.zod";

import type { Request, Response } from "express";

const controllerLogger = createLogger({ module: "CommentController" });

const createComment = async (req: Request, res: Response) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "createComment",
    req
  );

  try {
    actionLogger.info("Comment creation attempt started");
    const startTime = Date.now();

    const user = ensureAuthenticated(req);

    const { id: postId } = PostIdParamSchema.parse(req.params);
    const { content, parentId } = CreateCommentSchema.parse(req.body);

    actionLogger.info(
      {
        userId: user.id,
        postId,
        parentId,
        contentLength: content.length,
      },
      "User authenticated and request data validated"
    );

    actionLogger.debug("Processing comment creation");
    const serviceStartTime = Date.now();
    const newComment = await CommentService.createComment({
      content,
      authorId: user.id,
      postId,
      parentId,
    });
    if (!newComment) return;

    const serviceDuration = Date.now() - serviceStartTime;
    const totalDuration = Date.now() - startTime;

    actionLogger.info(
      {
        commentId: newComment.id,
        authorId: user.id,
        postId,
        parentId,
        contentLength: content.length,
        serviceDuration,
        totalDuration,
      },
      "Comment created successfully"
    );

    return res.status(201).json({
      message: "Comment created successfully",
      data: newComment,
    });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

const getParentComments = async (req: Request, res: Response) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "getParentComments",
    req
  );

  try {
    actionLogger.info("Fetching parent comments for post");
    const startTime = Date.now();

    const { id: postId } = PostIdParamSchema.parse(req.params);

    const customRepliesSchema = createPaginationSchema(10, 40, "number");
    const { limit, cursor } = customRepliesSchema.parse(req.query);

    actionLogger.info(
      {
        postId,
        limit,
        cursor,
      },
      "Parsed pagination parameters"
    );

    actionLogger.debug("Processing post parent comments fetch request");
    const serviceStartTime = Date.now();
    const result = await CommentService.getParentComments(
      postId,
      limit,
      cursor as number
    );
    const serviceDuration = Date.now() - serviceStartTime;

    const totalDuration = Date.now() - startTime;

    actionLogger.info(
      {
        postId,
        totalComments: result.pagination.totalComments,
        nextCursor: result.pagination.nextCursor,
        serviceDuration,
        totalDuration,
      },
      "Parent comments fetched successfully"
    );

    return res.status(200).json({
      data: result.comments,
      pagination: result.pagination,
    });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

const getReplies = async (req: Request, res: Response) => {
  const actionLogger = createActionLogger(controllerLogger, "getReplies", req);

  try {
    actionLogger.info("Fetching replies for comment");
    const startTime = Date.now();

    const { id: parentId } = CommentIdParamSchema.parse(req.params);

    const customRepliesSchema = createPaginationSchema(10, 40, "number");
    const { limit, cursor } = customRepliesSchema.parse(req.query);

    actionLogger.info(
      {
        parentId,
        limit,
        cursor,
      },
      "Parsed pagination parameters"
    );

    actionLogger.debug("Processing replies fetch request");
    const serviceStartTime = Date.now();
    const result = await CommentService.getReplies(
      parentId,
      limit,
      cursor as number
    );
    const serviceDuration = Date.now() - serviceStartTime;

    const totalDuration = Date.now() - startTime;
    actionLogger.info(
      {
        parentId,
        repliesReturned: result.replies.length,
        hasMore: result.pagination.hasMore,
        nextCursor: result.pagination.nextCursor,
        serviceDuration,
        totalDuration,
      },
      "Replies fetched successfully"
    );

    return res.status(200).json({
      data: result.replies,
      pagination: result.pagination,
    });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

const deleteComment = async (req: Request, res: Response) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "deleteComment",
    req
  );

  try {
    actionLogger.info("Comment deletion attempt started");
    const startTime = Date.now();

    const user = ensureAuthenticated(req);
    const { id: commentId } = CommentIdParamSchema.parse(req.params);
    actionLogger.debug("User authenticated and comment ID validated");

    actionLogger.debug("Processing comment deletion");
    const serviceStartTime = Date.now();
    await CommentService.deleteComment(commentId, user);
    const serviceDuration = Date.now() - serviceStartTime;

    const totalDuration = Date.now() - startTime;
    actionLogger.info(
      {
        commentId,
        serviceDuration,
        totalDuration,
      },
      "Comment deleted successfully"
    );

    return res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

export { createComment, deleteComment, getReplies, getParentComments };
