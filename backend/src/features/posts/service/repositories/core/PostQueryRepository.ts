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
  type ExtendedPost,
  type BasePost,
} from "../../types/postTypes.js";

import type { Prisma, PrismaClient } from "@prisma/client";

interface IPostQueryRepository {
  findManyPosts(
    where: Prisma.PostWhereInput,
    limit: number,
    cursor?: string,
  ): Promise<BasePost[]>;
  countPosts(where: Prisma.PostWhereInput): Promise<number>;
  findPostById(postId: string): Promise<BasePost | null>;
  findExtendedPostById(postId: string): Promise<ExtendedPost | null>;
  findPostMetadata(postId: string): Promise<unknown>;
  findUserLikes(
    userId: string,
    limit: number,
    cursor?: string,
  ): Promise<LikeWithPost[]>;
  findUserBookmarks(
    userId: string,
    limit: number,
    cursor?: string,
  ): Promise<BookmarkWithPost[]>;
  findBookmarksForPosts(
    userId: string,
    postIds: string[],
  ): Promise<{ postId: string }[]>;
  findLikesForPosts(
    userId: string,
    postIds: string[],
  ): Promise<{ postId: string }[]>;
  findBookmark(userId: string, postId: string): Promise<unknown>;
  findLike(userId: string, postId: string): Promise<unknown>;
  findPostForEdit(postId: string): Promise<ExtendedPost | null>;
}

class PostQueryRepository implements IPostQueryRepository {
  constructor(private client: PrismaClient) {}

  findManyPosts(where: Prisma.PostWhereInput, limit: number, cursor?: string) {
    const select = BaseSelectors.post;

    const baseQuery: Prisma.PostFindManyArgs = {
      where: { ...where, hidden: false },
      select,
      orderBy: { createdAt: "desc" },
    };

    const paginatedQuery = buildPaginatedQuery<"post">(baseQuery, {
      limit,
      cursor,
      cursorField: "id",
    });

    return this.client.post.findMany({
      ...paginatedQuery,
      select /** For better type inference */,
    });
  }

  countPosts(where: Prisma.PostWhereInput) {
    return this.client.post.count({ where });
  }

  findPostById(postId: string) {
    return this.client.post.findUnique({
      where: { id: postId },
      select: BaseSelectors.lessExtendedPost,
    }) as Promise<BasePost | null>;
  }

  findExtendedPostById(postId: string) {
    return this.client.post.findUnique({
      where: { id: postId },
      select: BaseSelectors.extendedPost,
    }) as Promise<ExtendedPost | null>;
  }

  findPostMetadata(postId: string) {
    return this.client.post.findUnique({
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

  findUserLikes(
    userId: string,
    limit: number,
    cursor?: string,
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

    return this.client.like.findMany(queryOptions) as Promise<LikeWithPost[]>;
  }

  findUserBookmarks(
    userId: string,
    limit: number,
    cursor?: string,
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

    return this.client.bookmark.findMany(queryOptions) as Promise<
      BookmarkWithPost[]
    >;
  }

  findBookmarksForPosts(userId: string, postIds: string[]) {
    if (postIds.length === 0) return Promise.resolve([]);

    return this.client.bookmark.findMany({
      where: {
        userId,
        postId: { in: postIds },
      },
      select: { postId: true },
    });
  }

  findLikesForPosts(userId: string, postIds: string[]) {
    if (postIds.length === 0) return Promise.resolve([]);

    return this.client.like.findMany({
      where: {
        userId,
        postId: { in: postIds },
      },
      select: { postId: true },
    });
  }

  findBookmark(userId: string, postId: string) {
    return this.client.bookmark.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });
  }

  findLike(userId: string, postId: string) {
    return this.client.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });
  }

  findPostForEdit(postId: string) {
    return this.client.post.findUnique({
      where: { id: postId },
      select: BaseSelectors.extendedPost,
    });
  }
}

const postQueryRepository = new PostQueryRepository(prisma);

export { postQueryRepository, type IPostQueryRepository };
