/* eslint-disable max-lines-per-function*/
import prisma from "../core/config/db";
import { createLogger } from "../core/config/logger.js";
import { handleError } from "../core/error/index";
import CommentService from "../features/comments/commentService";
import { checkPermission, ensureAuthenticated } from "../utils/auth.util";
import createActionLogger from "../utils/logger.util.js";
import {
  buildPaginatedQuery,
  createPaginationSchema,
  processPaginatedResults,
} from "../utils/pagination.util";
import { CreateCommentSchema } from "../zodSchemas/comment.zod";
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

    actionLogger.debug("Authenticating user");
    const user = ensureAuthenticated(req);

    actionLogger.debug("Validating request parameters and body");
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
    const newComment = await CommentService.createComment(
      { content, authorId: user.id, postId, parentId },
      res
    );
    if (!newComment) {
      const serviceDuration = Date.now() - serviceStartTime;
      const totalDuration = Date.now() - startTime;

      actionLogger.warn(
        { serviceDuration, totalDuration },
        "Comment creation failed"
      );
      return;
    }

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

    actionLogger.debug("Validating post ID");
    const { id: postId } = PostIdParamSchema.parse(req.params);

    actionLogger.debug("Checking if post exists");
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!post) {
      const totalDuration = Date.now() - startTime;
      actionLogger.warn({ postId, totalDuration }, "Post not found");
      return res.status(404).json({ message: "Post not found" });
    }

    actionLogger.debug("Parsing pagination parameters");
    const customRepliesSchema = createPaginationSchema(10, 40, "number");
    const { limit, cursor } = customRepliesSchema.parse(req.query);

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

    actionLogger.debug("Validating parent comment ID");
    const { id } = req.params;
    if (isNaN(parseInt(id, 10))) {
      actionLogger.warn({ parentId: id }, "Invalid parent comment ID provided");
      return res.status(400).json({ message: "Invalid parent ID!" });
    }

    const parentId = parseInt(id, 10);

    actionLogger.debug("Parsing pagination parameters");
    const customRepliesSchema = createPaginationSchema(10, 40, "number");
    const { limit, cursor } = customRepliesSchema.parse(req.query);

    actionLogger.debug("Checking if parent comment exists");
    const parentCheckStartTime = Date.now();
    const parent = await prisma.comment.findUnique({
      where: { id: parentId },
    });
    const parentCheckDuration = Date.now() - parentCheckStartTime;

    if (!parent) {
      actionLogger.warn(
        { parentId, parentCheckDuration },
        "Parent comment not found"
      );
      return res.status(404).json({ message: "Parent comment not found" });
    }

    actionLogger.info(
      {
        parentId,
        limit,
        cursor,
        hasCursor: !!cursor,
        parentCheckDuration,
      },
      "Parent comment validated and pagination parameters parsed"
    );

    const baseQuery = {
      where: { parentId },
      orderBy: { createdAt: "asc" as const },
      select: {
        id: true,
        content: true,
        author: { select: { id: true, username: true, avatarUrl: true } },
        createdAt: true,
      },
    };

    const paginatedQuery = buildPaginatedQuery<"comment">(baseQuery, {
      limit,
      cursor,
      cursorField: "id",
    });

    actionLogger.debug("Executing database queries for replies and count");
    const dbStartTime = Date.now();
    const [replies, totalItems] = await Promise.all([
      prisma.comment.findMany(paginatedQuery),
      prisma.comment.count({ where: { parentId } }),
    ]);
    const dbDuration = Date.now() - dbStartTime;

    actionLogger.info(
      {
        repliesCount: replies.length,
        totalItems,
        dbDuration,
      },
      "Replies and count retrieved from database"
    );

    const { data: repliesData, pagination } = processPaginatedResults(
      replies,
      limit,
      "id"
    );

    const totalDuration = Date.now() - startTime;
    actionLogger.info(
      {
        parentId,
        repliesReturned: replies.length,
        totalItems,
        hasMore: pagination.hasMore,
        nextCursor: pagination.nextCursor,
        parentCheckDuration,
        dbDuration,
        totalDuration,
      },
      "Replies fetched successfully"
    );

    return res.status(200).json({
      data: repliesData,
      pagination: {
        nextCursor: pagination.nextCursor,
        hasMore: pagination.hasMore,
        totalItems,
      },
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

    actionLogger.debug("Authenticating user");
    const user = ensureAuthenticated(req);

    actionLogger.debug("Validating comment ID");
    const { id: commentIdParam } = req.params;
    const commentId = parseInt(commentIdParam, 10);

    if (isNaN(commentId)) {
      actionLogger.warn(
        { commentId: commentIdParam },
        "Comment deletion failed - invalid comment ID"
      );
      return res.status(400).json({ message: "Invalid comment ID" });
    }

    actionLogger.info(
      {
        userId: user.id,
        commentId,
      },
      "User authenticated and comment ID validated"
    );

    actionLogger.debug("Fetching comment for permission check");
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        authorId: true,
      },
    });

    if (!comment) {
      actionLogger.warn(
        { commentId },
        "Comment deletion failed - comment not found"
      );
      return res.status(404).json({ message: "Comment not found" });
    }

    actionLogger.debug("Checking user permissions");
    checkPermission(user, comment);

    actionLogger.info(
      {
        commentId,
        authorId: comment.authorId,
        requestingUserId: user.id,
      },
      "Comment found and permission check passed"
    );

    actionLogger.debug("Deleting comment from database");
    await prisma.comment.delete({
      where: { id: commentId },
    });

    const totalDuration = Date.now() - startTime;
    actionLogger.info(
      {
        commentId,
        authorId: comment.authorId,
        deletedByUserId: user.id,
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
