import prisma from "../core/config/db";
import { handleError } from "../core/error/index";
import { checkPermission, ensureAuthenticated } from "../utils/auth.util";
import { CreateCommentSchema } from "../zodSchemas/comment.zod";
import { PostIdParamSchema } from "../zodSchemas/post.zod";

import type { Request, Response } from "express";

const createComment = async (req: Request, res: Response) => {
  try {
    const user = ensureAuthenticated(req);

    const { id: postId } = PostIdParamSchema.parse(req.params);
    const { content, parentId } = CreateCommentSchema.parse(req.body);

    const postExists = await prisma.post.findUnique({ where: { id: postId } });
    if (!postExists)
      return res.status(404).json({ message: "Post not found!" });

    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
      });

      if (!parentComment)
        return res.status(404).json({
          error: "Parent comment not found",
        });

      if (parentComment.postId !== postId)
        return res.status(400).json({
          error: "Parent comment does not belong to this post",
        });
    }

    const newComment = await prisma.comment.create({
      data: {
        content,
        authorId: user.id,
        postId,
        parentId: parentId ?? null,
      },
    });

    return res.status(201).json({
      message: "Comment created successfully",
      data: newComment,
    });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

const getReplies = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (isNaN(parseInt(id, 10)))
      return res.status(400).json({ message: "Invalid parent ID!" });

    const parentId = parseInt(id, 10);

    const parent = await prisma.comment.findUnique({
      where: { id: parentId },
    });
    if (!parent)
      return res.status(404).json({ message: "Parent comment not found" });

    const limit = Math.min(parseInt(req.query.limit as string) || 10, 40);
    const cursor = parseInt(req.query.cursor as string);

    const [replies, totalItems] = await prisma.$transaction([
      prisma.comment.findMany({
        where: { parentId },
        orderBy: { createdAt: "asc" },
        take: limit + 1,
        ...(cursor && {
          cursor: { id: cursor },
          skip: 1,
        }),
        select: {
          id: true,
          content: true,
          author: { select: { username: true, avatarUrl: true } },
          createdAt: true,
        },
      }),
      prisma.comment.count({ where: { parentId } }),
    ]);

    const hasNextPage = replies.length > limit;
    const repliesSlice = hasNextPage ? replies.slice(0, limit) : replies;
    const nextCursor = hasNextPage
      ? repliesSlice[repliesSlice.length - 1].id
      : null;

    return res.status(200).json({
      data: repliesSlice,
      pagination: {
        nextCursor,
        hasNextPage,
        totalItems,
      },
    });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

const deleteComment = async (req: Request, res: Response) => {
  try {
    const user = ensureAuthenticated(req);

    const { id: commentIdParam } = req.params;
    const commentId = parseInt(commentIdParam, 10);

    if (isNaN(commentId))
      return res.status(400).json({ message: "Invalid comment ID" });

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        authorId: true,
      },
    });

    if (!comment) return res.status(404).json({ message: "Comment not found" });

    checkPermission(user, comment);

    await prisma.comment.delete({
      where: { id: commentId },
    });

    return res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

export { createComment, deleteComment, getReplies };
