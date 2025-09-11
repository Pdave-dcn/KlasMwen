/**
 * @file This file contains the `PostService` class, which provides a data access layer for retrieving post-related data from the database.
 * @exports {class} PostService - The primary service class for all post-related database operations.
 *
 * @description
 * This service handles fetching various types of post data, including:
 * - Posts by a specific user, with pagination.
 * - Posts liked and bookmarked by a user, with compound cursors.
 * - A single post by its ID, with its comments.
 * - Metadata and edit-specific data for posts.
 *
 * The file defines several key components:
 * - **PostFragments:** Reusable Prisma `select` clauses for common relational data like authors and tags.
 * - **BaseSelectors:** Predefined selectors for different views of a post (e.g., `post`, `extendedPost`).
 * - **Prisma Validators:** Custom Prisma types for handling complex queries with included relations (e.g., `likeWithPost`).
 * - **PostService Class:** A static class with methods for all public-facing queries.
 *
 * It uses a combination of Prisma's `findMany` and `findUnique` methods and helper functions (`buildPaginatedQuery`, `buildCompoundCursorQuery`, `processPaginatedResults`) for efficient, cursor-based pagination.
 */

import { Prisma } from "@prisma/client";

import prisma from "../../core/config/db";
import {
  buildCompoundCursorQuery,
  buildPaginatedQuery,
  processPaginatedResults,
} from "../../utils/pagination.util";

import transformPostTagsToFlat from "./postTagFlattener";

import type { RawPost, TransformedPost } from "../../types/postTypes";

const PostFragments = {
  author: {
    select: {
      id: true,
      username: true,
      Avatar: {
        select: {
          id: true,
          url: true,
        },
      },
    },
  },

  postTags: {
    include: { tag: true },
  },

  counts: {
    select: { comments: true, likes: true },
  },

  commentAuthor: {
    select: {
      id: true,
      username: true,
      Avatar: { select: { id: true, url: true } },
    },
  },
} as const;

const BaseSelectors = {
  post: {
    id: true,
    title: true,
    content: true,
    type: true,
    fileUrl: true,
    fileName: true,
    createdAt: true,
    author: PostFragments.author,
    postTags: PostFragments.postTags,
    _count: PostFragments.counts,
  } satisfies Prisma.PostSelect,

  extendedPost: {
    id: true,
    title: true,
    content: true,
    type: true,
    fileUrl: true,
    fileName: true,
    fileSize: true,
    mimeType: true,
    createdAt: true,
    updatedAt: true,
    author: PostFragments.author,
    postTags: PostFragments.postTags,
    _count: PostFragments.counts,
  } satisfies Prisma.PostSelect,
} as const;

const likeWithPost = Prisma.validator<Prisma.LikeFindManyArgs>()({
  include: {
    post: {
      select: BaseSelectors.post,
    },
  },
});

type LikeWithPost = Prisma.LikeGetPayload<typeof likeWithPost>;

const bookmarkWithPost = Prisma.validator<Prisma.BookmarkFindManyArgs>()({
  include: {
    post: {
      select: BaseSelectors.post,
    },
  },
});

type BookmarkWithPost = Prisma.BookmarkGetPayload<typeof bookmarkWithPost>;

class PostService {
  static async getUserPosts(userId: string, limit: number, cursor?: string) {
    const baseQuery: Prisma.PostFindManyArgs = {
      where: { authorId: userId },
      select: BaseSelectors.post,
      orderBy: { createdAt: "desc" },
    };

    const paginatedQuery = buildPaginatedQuery<"post">(baseQuery, {
      limit,
      cursor,
      cursorField: "id",
    });

    const [posts, totalCount] = await Promise.all([
      prisma.post.findMany(paginatedQuery),
      prisma.post.count({ where: { authorId: userId } }),
    ]);

    const transformedPosts = posts.map(
      transformPostTagsToFlat as (post: Partial<RawPost>) => TransformedPost
    );
    const { data, pagination } = processPaginatedResults(
      transformedPosts,
      limit,
      "id"
    );

    return {
      posts: data,
      pagination: {
        hasMore: pagination.hasMore,
        nextCursor: pagination.nextCursor,
        totalPosts: totalCount,
      },
    };
  }

  static async getUserLikedPosts(
    userId: string,
    limit: number,
    cursor?: string
  ) {
    const baseQuery: Prisma.LikeFindManyArgs = {
      where: { userId },
      ...likeWithPost,
    };

    const queryOptions = buildCompoundCursorQuery<"like">(baseQuery, {
      cursor,
      limit,
      cursorFields: cursor ? { userId_postId: { userId, postId: cursor } } : {},
      where: { userId },
    });

    const likes = (await prisma.like.findMany(queryOptions)) as LikeWithPost[];

    const posts = likes.map((like) => like.post);
    const transformedPosts = posts.map(
      transformPostTagsToFlat as (post: Partial<RawPost>) => TransformedPost
    );

    const { data, pagination } = processPaginatedResults(
      transformedPosts,
      limit
    );

    return {
      posts: data,
      pagination,
    };
  }

  static async getUserBookmarkedPosts(
    userId: string,
    limit: number,
    cursor?: string
  ) {
    const baseQuery: Prisma.BookmarkFindManyArgs = {
      where: { userId },
      orderBy: { createdAt: "desc" },
      ...bookmarkWithPost,
    };

    const queryOptions = buildCompoundCursorQuery<"bookmark">(baseQuery, {
      cursor,
      limit,
      cursorFields: cursor ? { userId_postId: { userId, postId: cursor } } : {},
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    const bookmarks = (await prisma.bookmark.findMany(
      queryOptions
    )) as BookmarkWithPost[];

    const posts = bookmarks.map((bookmark) => bookmark.post);
    const transformedPosts = posts.map(
      transformPostTagsToFlat as (post: Partial<RawPost>) => TransformedPost
    );

    const { data, pagination } = processPaginatedResults(
      transformedPosts,
      limit
    );

    return {
      posts: data,
      pagination,
    };
  }

  static async getAllPosts(limit: number, cursor?: string) {
    const baseQuery: Prisma.PostFindManyArgs = {
      select: BaseSelectors.post,
      orderBy: { createdAt: "desc" },
    };

    const paginatedQuery = buildPaginatedQuery<"post">(baseQuery, {
      limit,
      cursor,
      cursorField: "id",
    });

    const posts = await prisma.post.findMany(paginatedQuery);
    const transformedPosts = posts.map(
      transformPostTagsToFlat as (post: Partial<RawPost>) => TransformedPost
    );
    const { data, pagination } = processPaginatedResults(
      transformedPosts,
      limit,
      "id"
    );

    return {
      posts: data,
      pagination,
    };
  }

  static async getPostById(
    postId: string,
    commentLimit: number,
    commentCursor?: number
  ) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        ...BaseSelectors.extendedPost,
        comments: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            author: PostFragments.commentAuthor,
          },
          orderBy: { createdAt: "asc" },
          take: commentLimit + 1,
          ...(commentCursor && {
            cursor: { id: commentCursor },
            skip: 1,
          }),
        },
      },
    });

    return post;
  }

  static getPostForEdit(postId: string) {
    return prisma.post.findUnique({
      where: { id: postId },
      select: BaseSelectors.extendedPost,
    });
  }

  static getPostMetadata(postId: string) {
    return prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        title: true,
        type: true,
        fileUrl: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        createdAt: true,
        updatedAt: true,
        authorId: true,
        author: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        _count: PostFragments.counts,
      },
    });
  }
}

export default PostService;
