import { Prisma } from "@prisma/client";

import prisma from "../../core/config/db";
import {
  buildPaginatedQuery,
  processPaginatedResults,
} from "../../utils/pagination.util";

import type { Response } from "express";

const CommentFragments = {
  commentAuthor: {
    select: {
      id: true,
      username: true,
      Avatar: { select: { url: true } },
    },
  },

  extendedCommentAuthor: {
    select: {
      id: true,
      username: true,
      Avatar: { select: { id: true, url: true } },
    },
  },

  commentPost: {
    select: {
      id: true,
      title: true,
      content: true,
      author: {
        select: {
          id: true,
          username: true,
        },
      },
    },
  },

  commentParent: {
    select: {
      id: true,
      content: true,
      author: {
        select: {
          id: true,
          username: true,
        },
      },
    },
  },

  count: {
    select: { comment: true },
  },
} as const;

const BaseSelectors = {
  comment: {
    id: true,
    content: true,
    createdAt: true,
    author: CommentFragments.extendedCommentAuthor,
    _count: {
      select: {
        Comment: true,
      },
    },
  } satisfies Prisma.CommentSelect,

  commentRelations: {
    author: CommentFragments.commentAuthor,
    post: CommentFragments.commentPost,
    parent: CommentFragments.commentParent,
  },
} as const;

const commentWithRelations = Prisma.validator<Prisma.CommentFindManyArgs>()({
  include: BaseSelectors.commentRelations,
});

type CommentWithRelations = Prisma.CommentGetPayload<
  typeof commentWithRelations
>;

interface CreateCommentData {
  content: string;
  authorId: string;
  postId: string;
  parentId?: number;
}

const transformCommentsForResponse = (comments: CommentWithRelations[]) => {
  return comments.map((comment) => ({
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt,
    author: {
      id: comment.author.id,
      username: comment.author.username,
      avatar: comment.author.Avatar ? { url: comment.author.Avatar.url } : null,
    },
    post: {
      id: comment.post.id,
      title: comment.post.title,
      content: comment.post.content
        ? comment.post.content.substring(0, 150) +
          (comment.post.content.length > 150 ? "..." : "")
        : null,
      author: comment.post.author,
    },
    parentComment: comment.parent
      ? {
          id: comment.parent.id,
          content:
            comment.parent.content.substring(0, 100) +
            (comment.parent.content.length > 100 ? "..." : ""),
          author: comment.parent.author,
        }
      : null,
    isReply: Boolean(comment.parent),
  }));
};

class CommentService {
  static async getUserCommentsWithRelations(
    userId: string,
    limit = 10,
    cursor?: string
  ) {
    const baseQuery: Prisma.CommentFindManyArgs = {
      where: { authorId: userId },
      ...commentWithRelations,
    };

    const paginatedQuery = buildPaginatedQuery<"comment">(baseQuery, {
      limit,
      cursor,
      cursorField: "id",
    });

    const comments = (await prisma.comment.findMany(
      paginatedQuery
    )) as CommentWithRelations[];

    const { data, pagination } = processPaginatedResults(comments, limit, "id");

    const transformedComments = transformCommentsForResponse(data);

    return {
      comments: transformedComments,
      pagination,
    };
  }

  static async getParentComments(postId: string, limit = 10, cursor?: number) {
    const baseQuery: Prisma.CommentFindManyArgs = {
      where: { postId, parentId: null },
      select: BaseSelectors.comment,
    };

    const paginatedQuery = buildPaginatedQuery<"comment">(baseQuery, {
      limit,
      cursor,
      cursorField: "id",
    });

    const [comments, totalComments] = await Promise.all([
      prisma.comment.findMany(paginatedQuery),
      prisma.comment.count({ where: { postId } }),
    ]);

    const { data, pagination } = processPaginatedResults(comments, limit, "id");

    return {
      comments: data,
      pagination: { ...pagination, totalComments },
    };
  }

  static async createComment(data: CreateCommentData, res: Response) {
    const postExists = await prisma.post.findUnique({
      where: { id: data.postId },
    });

    if (!postExists) {
      res.status(404).json({ message: "Post not found!" });
      return null;
    }

    if (data.parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: data.parentId },
      });

      if (!parentComment) {
        res.status(404).json({
          error: "Parent comment not found",
        });
        return null;
      }

      if (parentComment.postId !== data.postId) {
        res.status(400).json({
          error: "Parent comment does not belong to this post",
        });
        return null;
      }
    }

    const newComment = await prisma.comment.create({
      data: {
        content: data.content,
        authorId: data.authorId,
        postId: data.postId,
        parentId: data.parentId ?? null,
      },
    });

    return newComment;
  }
}

export { CommentWithRelations };
export default CommentService;
