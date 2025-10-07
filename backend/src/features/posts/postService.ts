/**
 * @file This file contains the `PostService` class, which provides a data access layer for retrieving post-related data from the database.
 * @exports {class} PostService - The primary service class for all post-related database operations.
 *
 * @description
 * This service handles fetching various types of post data, including:
 * - Posts by a specific user, with pagination.
 * - Posts liked and bookmarked by a user, with compound cursors.
 * - Media posts (posts without text content) by a specific user.
 * - A single post by its ID.
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

import { truncatePostContentValue } from "./postContentValueFormatter";
import transformPostTagsToFlat from "./postTagFlattener";

import type { RawPost, TransformedPost } from "../../types/postTypes";
import type { Response } from "express";
import type pino from "pino";

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

  lessExtendedPost: {
    id: true,
    title: true,
    content: true,
    type: true,
    fileUrl: true,
    fileName: true,
    fileSize: true,
    createdAt: true,
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

/**
 * PostService provides a data access layer for retrieving post-related data from the database.
 * It handles various queries, including paginated lists, user-specific posts, and detailed post data.
 *
 * @class PostService
 */
class PostService {
  private static async getPostsAndProcess(
    where: Prisma.PostWhereInput = {},
    limit: number,
    cursor?: string,
    currentUserId?: string
  ) {
    const baseQuery: Prisma.PostFindManyArgs = {
      where,
      select: BaseSelectors.post,
      orderBy: { createdAt: "desc" },
    };

    const paginatedQuery = buildPaginatedQuery<"post">(baseQuery, {
      limit,
      cursor,
      cursorField: "id",
    });

    const posts = await prisma.post.findMany(paginatedQuery);

    let bookmarkedPostIds = new Set<string>();
    let likedPostIds = new Set<string>();

    if (currentUserId && posts.length > 0) {
      const [bookmarks, likes] = await Promise.all([
        await prisma.bookmark.findMany({
          where: {
            userId: currentUserId,
            postId: { in: posts.map((p) => p.id) },
          },
          select: {
            postId: true,
          },
        }),

        await prisma.like.findMany({
          where: {
            userId: currentUserId,
            postId: { in: posts.map((p) => p.id) },
          },
          select: {
            postId: true,
          },
        }),
      ]);

      bookmarkedPostIds = new Set(bookmarks.map((b) => b.postId));
      likedPostIds = new Set(likes.map((l) => l.postId));
    }

    const transformedPosts = posts.map(
      transformPostTagsToFlat as (post: Partial<RawPost>) => TransformedPost
    );

    const postsWithTruncatedContent =
      truncatePostContentValue(transformedPosts);

    const postsWithBookmarkAndLikeStates = postsWithTruncatedContent.map(
      (post) => ({
        ...post,
        isBookmarked: currentUserId ? bookmarkedPostIds.has(post.id) : false,
        isLiked: currentUserId ? likedPostIds.has(post.id) : false,
      })
    );

    const { data, pagination } = processPaginatedResults(
      postsWithBookmarkAndLikeStates,
      limit,
      "id"
    );

    return { posts: data, pagination };
  }

  static getAllPosts(userId: string, limit: number, cursor?: string) {
    return this.getPostsAndProcess({}, limit, cursor, userId);
  }

  static async getUserPosts(userId: string, limit: number, cursor?: string) {
    const where = { authorId: userId };
    const { posts, pagination } = await this.getPostsAndProcess(
      where,
      limit,
      cursor,
      userId
    );

    const totalCount = await prisma.post.count({ where });

    return {
      posts,
      pagination: {
        ...pagination,
        totalPosts: totalCount,
      },
    };
  }

  static async getUserMediaPosts(
    userId: string,
    limit: number,
    cursor?: string
  ) {
    const where = { authorId: userId, content: null };
    const { posts, pagination } = await this.getPostsAndProcess(
      where,
      limit,
      cursor,
      userId
    );

    return { posts, pagination };
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

    const transformedPosts = posts.map((post) =>
      transformPostTagsToFlat(post as RawPost)
    );

    let bookmarkedPostIds = new Set<string>();

    if (transformedPosts.length > 0) {
      const bookmarks = await prisma.bookmark.findMany({
        where: {
          userId,
          postId: { in: posts.map((p) => p.id) },
        },
        select: { postId: true },
      });

      bookmarkedPostIds = new Set(bookmarks.map((b) => b.postId));
    }

    const postsWithBookmarkAndLikeStates = transformedPosts.map((post) => ({
      ...post,
      isBookmarked: bookmarkedPostIds.has(post.id),
      isLiked: true,
    }));

    const { data, pagination } = processPaginatedResults(
      postsWithBookmarkAndLikeStates,
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

    let likedPostIds = new Set<string>();

    if (transformedPosts.length > 0) {
      const likes = await prisma.like.findMany({
        where: {
          userId,
          postId: { in: posts.map((p) => p.id) },
        },
        select: {
          postId: true,
        },
      });

      likedPostIds = new Set(likes.map((l) => l.postId));
    }

    const postsWithBookmarkAndLikeStates = transformedPosts.map((post) => ({
      ...post,
      isBookmarked: true,
      isLiked: likedPostIds.has(post.id),
    }));

    const { data, pagination } = processPaginatedResults(
      postsWithBookmarkAndLikeStates,
      limit
    );

    return {
      posts: data,
      pagination,
    };
  }

  static async getPostById(
    postId: string,
    startTime: number,
    actionLogger: pino.Logger,
    res: Response,
    currentUserId: string
  ) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        ...BaseSelectors.lessExtendedPost,
      },
    });

    if (!post) {
      const totalDuration = Date.now() - startTime;
      actionLogger.warn({ postId, totalDuration }, "Post not found");
      res.status(404).json({ message: "Post not found" });

      return null;
    }

    const transformedPost = transformPostTagsToFlat(post as RawPost);

    let isBookmarked = false;
    let isLiked = false;

    if (currentUserId) {
      const [bookmark, like] = await Promise.all([
        prisma.bookmark.findUnique({
          where: {
            userId_postId: {
              userId: currentUserId,
              postId,
            },
          },
        }),
        prisma.like.findUnique({
          where: {
            userId_postId: {
              userId: currentUserId,
              postId,
            },
          },
        }),
      ]);

      isBookmarked = !!bookmark;
      isLiked = !!like;
    }

    return {
      ...transformedPost,
      isBookmarked,
      isLiked,
    };
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
