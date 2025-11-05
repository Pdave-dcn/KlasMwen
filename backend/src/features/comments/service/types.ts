import { Prisma } from "@prisma/client";

// Fragment definitions for reusable select objects
const CommentFragments = {
  commentAuthor: {
    select: {
      id: true,
      username: true,
      Avatar: { select: { url: true } },
    },
  },

  mentionedUser: {
    select: {
      id: true,
      username: true,
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

// Base selectors for different query types
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

  reply: {
    id: true,
    content: true,
    createdAt: true,
    author: CommentFragments.extendedCommentAuthor,
    mentionedUser: CommentFragments.mentionedUser,
  } satisfies Prisma.CommentSelect,

  commentRelations: {
    author: CommentFragments.commentAuthor,
    post: CommentFragments.commentPost,
    parent: CommentFragments.commentParent,
  },
} as const;

// Prisma type validators
const commentWithRelations = Prisma.validator<Prisma.CommentFindManyArgs>()({
  include: BaseSelectors.commentRelations,
});

type CommentWithRelations = Prisma.CommentGetPayload<
  typeof commentWithRelations
>;

// DTOs and interfaces
interface CreateCommentData {
  content: string;
  authorId: string;
  postId: string;
  parentId?: number;
}

interface PaginationParams {
  limit?: number;
  cursor?: number | string;
}

interface CommentPaginationResult<T> {
  data: T[];
  pagination: {
    nextCursor: number | string | null;
    hasMore: boolean;
    totalComments?: number;
  };
}

// Transformed response types
interface TransformedComment {
  id: number;
  content: string;
  createdAt: Date;
  author: {
    id: string;
    username: string;
    avatar: { url: string } | null;
  };
  post: {
    id: string;
    title: string;
    content: string | null;
    author: {
      id: string;
      username: string;
    };
  };
  parentComment: {
    id: number;
    content: string;
    author: {
      id: string;
      username: string;
    };
  } | null;
  isReply: boolean;
}

export {
  TransformedComment,
  commentWithRelations,
  BaseSelectors,
  CommentWithRelations,
  CreateCommentData,
  PaginationParams,
  CommentPaginationResult,
};
