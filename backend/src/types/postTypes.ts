import type { PostType } from "@prisma/client";

interface Comment {
  id: number;
  content: string;
  createdAt: Date;
  author: {
    id: string;
    username: string;
    Avatar: {
      id: number;
      url: string;
    } | null;
  };
}

interface RawPost {
  id: string;
  title: string;
  content: string | null;
  type: PostType;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  createdAt: Date;
  updatedAt?: Date;
  author: {
    id: string;
    username: string;
    Avatar: {
      id: number;
      url: string;
    } | null;
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
    hasMore: boolean;
    nextCursor: number | null;
    totalComments: number;
  };
}

interface RawPostWithComments extends Required<Pick<RawPost, "comments">> {
  id: string;
  title: string;
  content: string | null;
  type: PostType;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  createdAt: Date;
  updatedAt?: Date;
  author: {
    id: string;
    username: string;
    Avatar: {
      id: number;
      url: string;
    } | null;
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

// Utility type to check if a post is a resource post
interface ResourcePost extends TransformedPost {
  type: "RESOURCE";
  fileUrl: string; // Non-null for resource posts
  fileName: string;
  fileSize: number;
  mimeType: string;
}

// Utility type to check if a post has text content
interface TextPost extends TransformedPost {
  type: "QUESTION" | "NOTE";
  content: string; // Non-null for text posts
}

interface CommentPaginationResult {
  paginatedComments: Comment[];
  paginationMeta: {
    hasMore: boolean;
    nextCursor: number | null;
    totalComments: number;
  };
}

// New interfaces for post creation
interface BasePostInput {
  title: string;
  tagIds: number[];
}

interface TextPostInput extends BasePostInput {
  type: "QUESTION" | "NOTE";
  content: string;
}

interface ResourcePostInput extends BasePostInput {
  type: "RESOURCE";
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

type CreatePostInput = TextPostInput | ResourcePostInput;

export type {
  Comment,
  RawPost,
  TransformedPost,
  TransformedPostWithPagination,
  RawPostWithComments,
  ResourcePost,
  TextPost,
  CommentPaginationResult,
  CreatePostInput,
  TextPostInput,
  ResourcePostInput,
};
