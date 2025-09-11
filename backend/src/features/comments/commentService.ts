import { Prisma } from "@prisma/client";

import prisma from "../../core/config/db";
import {
  buildPaginatedQuery,
  processPaginatedResults,
} from "../../utils/pagination.util";

const CommentFragments = {
  commentAuthor: {
    select: {
      id: true,
      username: true,
      Avatar: { select: { url: true } },
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
    select: { comments: true },
  },
} as const;

const BaseSelectors = {
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
}

export default CommentService;
