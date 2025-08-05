import type { PostType } from "@prisma/client";

interface Comment {
  id: number;
  content: string;
  createdAt: Date;
  author: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
}

interface RawPost {
  id: string;
  title: string;
  content: string;
  type: PostType;
  createdAt: Date;
  updatedAt?: Date;
  author: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
  postTags: {
    postId: string;
    tagId: number;
    tag: {
      id: number;
      name: string;
    };
  }[];
  comments?: Comment[];
  _count: {
    comments: number;
    likes: number;
  };
}

interface TransformedPost extends Omit<RawPost, "postTags"> {
  tags: {
    id: number;
    name: string;
  }[];
}

// Extended interface for posts with comment pagination
interface TransformedPostWithPagination extends TransformedPost {
  commentsPagination: {
    hasNextPage: boolean;
    nextCursor: string | null;
    totalComments: number;
  };
}

interface RawPostWithComments extends Required<Pick<RawPost, "comments">> {
  id: string;
  title: string;
  content: string;
  type: PostType;
  createdAt: Date;
  updatedAt?: Date;
  author: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
  postTags: {
    postId: string;
    tagId: number;
    tag: {
      id: number;
      name: string;
    };
  }[];
  comments: Comment[];
  _count: {
    comments: number;
    likes: number;
  };
}

interface CommentPaginationResult {
  paginatedComments: Comment[];
  paginationMeta: {
    hasNextPage: boolean;
    nextCursor: string | null;
    totalComments: number;
  };
}

export {
  Comment,
  RawPost,
  TransformedPost,
  TransformedPostWithPagination,
  RawPostWithComments,
  CommentPaginationResult,
};
