import { createLogger } from "../core/config/logger.js";
import { commentService } from "../features/comment/service/index.js";
import { withLogging } from "../utils/logger.util.js";
import { createPaginationSchema } from "../utils/pagination.util.js";
import {
  CommentIdParamSchema,
  CreateCommentSchema,
} from "../zodSchemas/comment.zod.js";
import { PostIdParamSchema } from "../zodSchemas/post.zod.js";

import type { AuthenticatedRequest } from "../types/AuthRequest.js";

const controllerLogger = createLogger({ module: "CommentController" });

const createComment = withLogging<AuthenticatedRequest>(
  controllerLogger,
  "createComment",
  async ({ req, res, log }) => {
    log.info("Received request to create comment");
    const { id: postId } = PostIdParamSchema.parse(req.params);
    const { content, parentId } = CreateCommentSchema.parse(req.body);

    log.debug(
      { postId, hasParent: !!parentId, contentLength: content.length },
      "Processing comment creation",
    );
    const newComment = await commentService.command.createComment(
      { content, authorId: req.user.id, postId, parentId },
      req.app,
    );

    log.info(
      { commentId: newComment.id, postId },
      "Comment created successfully",
    );
    res.status(201).json({
      message: "Comment created successfully",
      data: newComment,
    });
  },
);

const getParentComments = withLogging<AuthenticatedRequest>(
  controllerLogger,
  "getParentComments",
  async ({ req, res, log }) => {
    log.info("Received request to fetch parent comments");
    const { id: postId } = PostIdParamSchema.parse(req.params);

    const customRepliesSchema = createPaginationSchema(10, 40, "number");
    const { limit, cursor } = customRepliesSchema.parse(req.query);

    log.debug({ postId }, "Fetching parent comments for post");
    const result = await commentService.query.getParentComments(
      postId,
      limit,
      cursor as number,
    );

    log.info(
      { postId, totalComments: result.pagination.totalComments },
      "Parent comments fetched successfully",
    );

    res.status(200).json(result);
  },
);

const getReplies = withLogging<AuthenticatedRequest>(
  controllerLogger,
  "getReplies",
  async ({ req, res, log }) => {
    log.info("Received request to fetch replies for comment");
    const { id: parentId } = CommentIdParamSchema.parse(req.params);

    const customRepliesSchema = createPaginationSchema(10, 40, "number");
    const { limit, cursor } = customRepliesSchema.parse(req.query);

    log.debug({ parentId }, "Fetching replies for comment");
    const result = await commentService.query.getReplies(
      parentId,
      limit,
      cursor as number,
    );

    log.info(
      {
        parentId,
        repliesReturned: result.data.length,
        hasMore: result.pagination.hasMore,
      },
      "Replies fetched successfully",
    );

    res.status(200).json(result);
  },
);

const deleteComment = withLogging<AuthenticatedRequest>(
  controllerLogger,
  "deleteComment",
  async ({ req, res, log }) => {
    log.info("Received request to delete comment");
    const { id: commentId } = CommentIdParamSchema.parse(req.params);

    log.debug({ commentId }, "Processing comment deletion");
    await commentService.command.deleteComment(commentId, req.user);

    log.info({ commentId }, "Comment deleted successfully");
    res.status(200).json({ message: "Comment deleted successfully" });
  },
);

export { createComment, deleteComment, getReplies, getParentComments };
