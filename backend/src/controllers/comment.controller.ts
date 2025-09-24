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
    const authStartTime = Date.now();
    const user = ensureAuthenticated(req);
    const authDuration = Date.now() - authStartTime;

    actionLogger.debug("Validating request parameters and body");
    const validationStartTime = Date.now();
    const { id: postId } = PostIdParamSchema.parse(req.params);
    const { content, parentId } = CreateCommentSchema.parse(req.body);
    const validationDuration = Date.now() - validationStartTime;

    actionLogger.info(
      {
        userId: user.id,
        postId,
        parentId,
        contentLength: content.length,
        authDuration,
        validationDuration,
      },
      "User authenticated and request data validated"
    );

    actionLogger.debug("Checking if post exists");
    const postCheckStartTime = Date.now();
    const postExists = await prisma.post.findUnique({ where: { id: postId } });
    const postCheckDuration = Date.now() - postCheckStartTime;

    if (!postExists) {
      actionLogger.warn(
        { postId, postCheckDuration },
        "Comment creation failed - post not found"
      );
      return res.status(404).json({ message: "Post not found!" });
    }

    actionLogger.debug(
      { postId, postCheckDuration },
      "Post exists validation passed"
    );

    let parentCheckDuration = 0;
    if (parentId) {
      actionLogger.debug("Validating parent comment");
      const parentCheckStartTime = Date.now();
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
      });
      parentCheckDuration = Date.now() - parentCheckStartTime;

      if (!parentComment) {
        actionLogger.warn(
          { parentId, parentCheckDuration },
          "Comment creation failed - parent comment not found"
        );
        return res.status(404).json({
          error: "Parent comment not found",
        });
      }

      if (parentComment.postId !== postId) {
        actionLogger.warn(
          {
            parentId,
            parentPostId: parentComment.postId,
            requestedPostId: postId,
            parentCheckDuration,
          },
          "Comment creation failed - parent comment belongs to different post"
        );
        return res.status(400).json({
          error: "Parent comment does not belong to this post",
        });
      }

      actionLogger.debug(
        { parentId, parentCheckDuration },
        "Parent comment validation passed"
      );
    }

    actionLogger.debug("Creating comment in database");
    const dbStartTime = Date.now();
    const newComment = await prisma.comment.create({
      data: {
        content,
        authorId: user.id,
        postId,
        parentId: parentId ?? null,
      },
    });
    const dbDuration = Date.now() - dbStartTime;

    const totalDuration = Date.now() - startTime;
    actionLogger.info(
      {
        commentId: newComment.id,
        authorId: user.id,
        postId,
        parentId,
        contentLength: content.length,
        authDuration,
        validationDuration,
        postCheckDuration,
        parentCheckDuration: parentId ? parentCheckDuration : undefined,
        dbDuration,
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

// todo: write tests
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

    actionLogger.debug("Parsing pagination parameters");
    const customRepliesSchema = createPaginationSchema(10, 40, "number");
    const { limit, cursor } = customRepliesSchema.parse(req.query);

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
    const authStartTime = Date.now();
    const user = ensureAuthenticated(req);
    const authDuration = Date.now() - authStartTime;

    actionLogger.debug("Validating comment ID");
    const { id: commentIdParam } = req.params;
    const commentId = parseInt(commentIdParam, 10);

    if (isNaN(commentId)) {
      actionLogger.warn(
        { commentId: commentIdParam, authDuration },
        "Comment deletion failed - invalid comment ID"
      );
      return res.status(400).json({ message: "Invalid comment ID" });
    }

    actionLogger.info(
      {
        userId: user.id,
        commentId,
        authDuration,
      },
      "User authenticated and comment ID validated"
    );

    actionLogger.debug("Fetching comment for permission check");
    const commentFetchStartTime = Date.now();
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        authorId: true,
      },
    });
    const commentFetchDuration = Date.now() - commentFetchStartTime;

    if (!comment) {
      actionLogger.warn(
        { commentId, commentFetchDuration },
        "Comment deletion failed - comment not found"
      );
      return res.status(404).json({ message: "Comment not found" });
    }

    actionLogger.debug("Checking user permissions");
    const permissionStartTime = Date.now();
    checkPermission(user, comment);
    const permissionDuration = Date.now() - permissionStartTime;

    actionLogger.info(
      {
        commentId,
        authorId: comment.authorId,
        requestingUserId: user.id,
        commentFetchDuration,
        permissionDuration,
      },
      "Comment found and permission check passed"
    );

    actionLogger.debug("Deleting comment from database");
    const dbStartTime = Date.now();
    await prisma.comment.delete({
      where: { id: commentId },
    });
    const dbDuration = Date.now() - dbStartTime;

    const totalDuration = Date.now() - startTime;
    actionLogger.info(
      {
        commentId,
        authorId: comment.authorId,
        deletedByUserId: user.id,
        authDuration,
        commentFetchDuration,
        permissionDuration,
        dbDuration,
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
