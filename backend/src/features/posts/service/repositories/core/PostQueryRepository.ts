import prisma from "../../../../../core/config/db.js";
import {
  buildCompoundCursorQuery,
  buildPaginatedQuery,
} from "../../../../../utils/pagination.util.js";
import {
  BaseSelectors,
  likeWithPost,
  bookmarkWithPost,
  type LikeWithPost,
  type BookmarkWithPost,
} from "../../types/postTypes.js";

import type { Prisma } from "@prisma/client";

/**
 * PostQueryRepository - Read operations only
 */
class PostQueryRepository {
  /**
   * Find posts with filters and pagination
   */
  static findManyPosts(
    where: Prisma.PostWhereInput,
    limit: number,
    cursor?: string
  ) {
    const baseQuery: Prisma.PostFindManyArgs = {
      where: { ...where, hidden: false },
      select: BaseSelectors.post,
      orderBy: { createdAt: "desc" },
    };

    const paginatedQuery = buildPaginatedQuery<"post">(baseQuery, {
      limit,
      cursor,
      cursorField: "id",
    });

    return prisma.post.findMany(paginatedQuery);
  }

  /**
   * Count posts matching criteria
   */
  static countPosts(where: Prisma.PostWhereInput) {
    return prisma.post.count({ where });
  }

  /**
   * Find a single post by ID
   */
  static findPostById(postId: string) {
    return prisma.post.findUnique({
      where: { id: postId },
      select: BaseSelectors.lessExtendedPost,
    });
  }

  /**
   * Find an extended post by ID (with more metadata)
   */
  static findExtendedPostById(postId: string) {
    return prisma.post.findUnique({
      where: { id: postId },
      select: BaseSelectors.extendedPost,
    });
  }

  /**
   * Find post metadata only
   */
  static findPostMetadata(postId: string) {
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
        _count: {
          select: { comments: true, likes: true },
        },
      },
    });
  }

  /**
   * Find user's liked posts
   */
  static findUserLikes(
    userId: string,
    limit: number,
    cursor?: string
  ): Promise<LikeWithPost[]> {
    const baseQuery: Prisma.LikeFindManyArgs = {
      where: {
        userId,
        post: {
          hidden: false,
        },
      },
      ...likeWithPost,
    };

    const queryOptions = buildCompoundCursorQuery<"like">(baseQuery, {
      cursor,
      limit,
      cursorFields: cursor ? { userId_postId: { userId, postId: cursor } } : {},
      where: { userId },
    });

    return prisma.like.findMany(queryOptions) as Promise<LikeWithPost[]>;
  }

  /**
   * Find user's bookmarked posts
   */
  static findUserBookmarks(
    userId: string,
    limit: number,
    cursor?: string
  ): Promise<BookmarkWithPost[]> {
    const baseQuery: Prisma.BookmarkFindManyArgs = {
      where: {
        userId,
        post: {
          hidden: false,
        },
      },
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

    return prisma.bookmark.findMany(queryOptions) as Promise<
      BookmarkWithPost[]
    >;
  }

  /**
   * Find user's bookmarks for specific posts
   */
  static findBookmarksForPosts(userId: string, postIds: string[]) {
    if (postIds.length === 0) return [];

    return prisma.bookmark.findMany({
      where: {
        userId,
        postId: { in: postIds },
      },
      select: { postId: true },
    });
  }

  /**
   * Find user's likes for specific posts
   */
  static findLikesForPosts(userId: string, postIds: string[]) {
    if (postIds.length === 0) return [];

    return prisma.like.findMany({
      where: {
        userId,
        postId: { in: postIds },
      },
      select: { postId: true },
    });
  }

  /**
   * Find a single bookmark
   */
  static findBookmark(userId: string, postId: string) {
    return prisma.bookmark.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });
  }

  /**
   * Find a single like
   */
  static findLike(userId: string, postId: string) {
    return prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });
  }

  /**
   * Find post for editing (with all metadata)
   */
  static findPostForEdit(postId: string) {
    return prisma.post.findUnique({
      where: { id: postId },
      select: BaseSelectors.extendedPost,
    });
  }
}

export default PostQueryRepository;
