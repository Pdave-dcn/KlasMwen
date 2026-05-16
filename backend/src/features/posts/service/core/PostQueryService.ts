import { PostNotFoundError } from "../../../../core/error/custom/post.error.js";
import { processPaginatedResults } from "../../../../utils/pagination.util.js";
import {
  postEnricher,
  type IPostEnricher,
} from "../enrichers/postEnrichers.js";
import {
  postRepository,
  type IPostRepository,
} from "../repositories/postRepository.js";
import {
  postTransformer,
  type IPostTransformer,
} from "../transformers/postTransformers.js";

import type {
  BasePost,
  EnrichedPost,
  EnrichedPostPreview,
  ExtendedPost,
  PaginatedPostsResponse,
} from "../types/postTypes.js";
import type { Prisma } from "@prisma/client";

interface IPostQueryService {
  getAllPosts(
    userId: string,
    limit: number,
    cursor?: string,
  ): Promise<PaginatedPostsResponse>;
  getUserPosts(
    userId: string,
    limit: number,
    cursor?: string,
  ): Promise<PaginatedPostsResponse>;
  getUserMediaPosts(
    userId: string,
    limit: number,
    cursor?: string,
  ): Promise<PaginatedPostsResponse>;
  getUserLikedPosts(
    userId: string,
    limit: number,
    cursor?: string,
  ): Promise<PaginatedPostsResponse>;
  getUserBookmarkedPosts(
    userId: string,
    limit: number,
    cursor?: string,
  ): Promise<PaginatedPostsResponse>;
  getPostById(postId: string, currentUserId: string): Promise<EnrichedPost>;
  getResourcePostById(postId: string): Promise<ExtendedPost>;
  fetchAndProcessPosts(
    where: Prisma.PostWhereInput,
    limit: number,
    currentUserId: string,
    cursor?: string,
  ): Promise<PaginatedPostsResponse>;
}

class PostQueryService implements IPostQueryService {
  constructor(
    private repository: IPostRepository,
    private transformer: IPostTransformer,
    private enricher: IPostEnricher,
  ) {}

  async fetchAndProcessPosts(
    where: Prisma.PostWhereInput,
    limit: number,
    currentUserId: string,
    cursor?: string,
  ): Promise<PaginatedPostsResponse> {
    const posts = await this.repository.query.findManyPosts(
      where,
      limit,
      cursor,
    );
    const postIds = posts.map((p: { id: string }) => p.id);

    const [transformedPosts, states] = await Promise.all([
      Promise.resolve(this.transformer.transformPostsWithTruncation(posts)),
      this.enricher.getBookmarkAndLikeStates(currentUserId, postIds),
    ]);

    const enrichedPosts = this.enricher.enrichPostsWithStates(
      transformedPosts,
      states,
      currentUserId,
    );

    return this.buildPaginatedResponse(enrichedPosts, limit);
  }

  private buildPaginatedResponse(
    posts: (EnrichedPost | EnrichedPostPreview)[],
    limit: number,
  ): PaginatedPostsResponse {
    const { data, pagination } = processPaginatedResults(posts, limit, "id");

    return {
      posts: data,
      pagination: {
        ...pagination,
        nextCursor:
          typeof pagination.nextCursor === "string"
            ? pagination.nextCursor
            : null,
      },
    };
  }

  private async processPostsWithFixedStates<T extends BasePost>(
    posts: T[],
    userId: string,
    limit: number,
    isLikedFixed: boolean,
    isBookmarkedFixed: boolean,
  ): Promise<PaginatedPostsResponse> {
    const transformedPosts = this.transformer.transformPosts(posts);

    const postIds = posts.map((p) => p.id);
    const states = await this.enricher.getBookmarkAndLikeStates(
      userId,
      postIds,
    );

    const enrichedPosts = this.enricher.enrichPostsWithFixedStates(
      transformedPosts,
      isLikedFixed,
      isBookmarkedFixed,
      states,
    );

    return this.buildPaginatedResponse(enrichedPosts, limit);
  }

  getAllPosts(
    userId: string,
    limit: number,
    cursor?: string,
  ): Promise<PaginatedPostsResponse> {
    return this.fetchAndProcessPosts({}, limit, userId, cursor);
  }

  async getUserPosts(
    userId: string,
    limit: number,
    cursor?: string,
  ): Promise<PaginatedPostsResponse> {
    const where = { authorId: userId };
    const [result, totalCount] = await Promise.all([
      this.fetchAndProcessPosts(where, limit, userId, cursor),
      this.repository.query.countPosts(where),
    ]);

    return {
      ...result,
      pagination: { ...result.pagination, totalPosts: totalCount },
    };
  }

  getUserMediaPosts(
    userId: string,
    limit: number,
    cursor?: string,
  ): Promise<PaginatedPostsResponse> {
    const where = { authorId: userId, content: null };
    return this.fetchAndProcessPosts(where, limit, userId, cursor);
  }

  async getUserLikedPosts(
    userId: string,
    limit: number,
    cursor?: string,
  ): Promise<PaginatedPostsResponse> {
    const likes = await this.repository.query.findUserLikes(
      userId,
      limit,
      cursor,
    );
    const posts = likes.map((like) => like.post);

    return this.processPostsWithFixedStates(posts, userId, limit, true, false);
  }

  async getUserBookmarkedPosts(
    userId: string,
    limit: number,
    cursor?: string,
  ): Promise<PaginatedPostsResponse> {
    const bookmarks = await this.repository.query.findUserBookmarks(
      userId,
      limit,
      cursor,
    );
    const posts = bookmarks.map((bookmark) => bookmark.post);

    return this.processPostsWithFixedStates(posts, userId, limit, false, true);
  }

  async getPostById(postId: string, currentUserId: string) {
    const post = await this.repository.query.findPostById(postId);

    if (!post) {
      throw new PostNotFoundError(postId);
    }

    const transformedPost = this.transformer.transformPost(post);
    return this.enricher.enrichSinglePost(transformedPost, currentUserId);
  }

  async getResourcePostById(postId: string) {
    const post = await this.repository.query.findExtendedPostById(postId);

    if (!post) {
      throw new PostNotFoundError(postId);
    }

    if (!post.fileUrl) {
      throw new Error("Post is not a resource post");
    }

    return post;
  }
}

const postQueryService = new PostQueryService(
  postRepository,
  postTransformer,
  postEnricher,
);

export { postQueryService, type IPostQueryService };
