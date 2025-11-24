import { PostNotFoundError } from "../../../../core/error/custom/post.error.js";
import { processPaginatedResults } from "../../../../utils/pagination.util.js";
import PostEnricher from "../enrichers/postEnrichers.js";
import PostRepository from "../repositories/postRepository.js";
import PostTransformer from "../transformers/postTransformers.js";

import type {
  EnrichedPost,
  EnrichedPostPreview,
  PaginatedPostsResponse,
  RawPost,
} from "../types/postTypes.js";
import type { Prisma } from "@prisma/client";

/**
 * Handles all read operations for posts.
 * Orchestrates fetching, transforming, and enriching post data.
 */
export class PostQueryService {
  /**
   * Fetch, transform, enrich, and paginate posts.
   * Central orchestration method for consistent post processing.
   */
  private static async fetchAndProcessPosts(
    where: Prisma.PostWhereInput,
    limit: number,
    currentUserId: string,
    cursor?: string
  ): Promise<PaginatedPostsResponse> {
    const posts = await PostRepository.findManyPosts(where, limit, cursor);
    const postIds = posts.map((p) => p.id);

    const [transformedPosts, states] = await Promise.all([
      Promise.resolve(
        PostTransformer.transformPostsWithTruncation(
          posts as Partial<RawPost>[]
        )
      ),
      PostEnricher.getBookmarkAndLikeStates(currentUserId, postIds),
    ]);

    const enrichedPosts = PostEnricher.enrichPostsWithStates(
      transformedPosts,
      states,
      currentUserId
    );

    return this.buildPaginatedResponse(enrichedPosts, limit);
  }

  /**
   * Build standardized paginated response.
   */
  private static buildPaginatedResponse(
    posts: (EnrichedPost | EnrichedPostPreview)[],
    limit: number
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

  /**
   * Process posts with fixed states (for liked/bookmarked queries).
   */
  private static async processPostsWithFixedStates<T extends { id: string }>(
    posts: T[],
    userId: string,
    limit: number,
    isLikedFixed: boolean,
    isBookmarkedFixed: boolean
  ): Promise<PaginatedPostsResponse> {
    const transformedPosts = PostTransformer.transformPosts(
      posts as Partial<RawPost>[]
    );

    const postIds = posts.map((p) => p.id);
    const states = await PostEnricher.getBookmarkAndLikeStates(userId, postIds);

    const enrichedPosts = PostEnricher.enrichPostsWithFixedStates(
      transformedPosts,
      isLikedFixed,
      isBookmarkedFixed,
      states
    );

    return this.buildPaginatedResponse(enrichedPosts, limit);
  }

  /**
   * Get all posts (main feed).
   */
  static getAllPosts(
    userId: string,
    limit: number,
    cursor?: string
  ): Promise<PaginatedPostsResponse> {
    return this.fetchAndProcessPosts({}, limit, userId, cursor);
  }

  /**
   * Get posts by specific user with total count.
   */
  static async getUserPosts(
    userId: string,
    limit: number,
    cursor?: string
  ): Promise<PaginatedPostsResponse> {
    const where = { authorId: userId };
    const [result, totalCount] = await Promise.all([
      this.fetchAndProcessPosts(where, limit, userId, cursor),
      PostRepository.countPosts(where),
    ]);

    return {
      ...result,
      pagination: { ...result.pagination, totalPosts: totalCount },
    };
  }

  /**
   * Get media-only posts by user (no text content).
   */
  static getUserMediaPosts(
    userId: string,
    limit: number,
    cursor?: string
  ): Promise<PaginatedPostsResponse> {
    const where = { authorId: userId, content: null };
    return this.fetchAndProcessPosts(where, limit, userId, cursor);
  }

  /**
   * Get posts liked by user.
   */
  static async getUserLikedPosts(
    userId: string,
    limit: number,
    cursor?: string
  ): Promise<PaginatedPostsResponse> {
    const likes = await PostRepository.findUserLikes(userId, limit, cursor);
    const posts = likes.map((like) => like.post);

    return this.processPostsWithFixedStates(posts, userId, limit, true, false);
  }

  /**
   * Get posts bookmarked by user.
   */
  static async getUserBookmarkedPosts(
    userId: string,
    limit: number,
    cursor?: string
  ): Promise<PaginatedPostsResponse> {
    const bookmarks = await PostRepository.findUserBookmarks(
      userId,
      limit,
      cursor
    );
    const posts = bookmarks.map((bookmark) => bookmark.post);

    return this.processPostsWithFixedStates(posts, userId, limit, false, true);
  }

  /**
   * Get single post by ID with enrichment.
   * @throws {PostNotFoundError} if not found
   */
  static async getPostById(postId: string, currentUserId: string) {
    const post = await PostRepository.findPostById(postId);

    if (!post) {
      throw new PostNotFoundError(postId);
    }

    const transformedPost = PostTransformer.transformPost(post as RawPost);
    return PostEnricher.enrichSinglePost(transformedPost, currentUserId);
  }

  /**
   * Get resource post by ID (must have fileUrl).
   * @throws {PostNotFoundError} if not found
   * @throws {Error} if not a resource post
   */
  static async getResourcePostById(postId: string) {
    const post = await PostRepository.findExtendedPostById(postId);

    if (!post) {
      throw new PostNotFoundError(postId);
    }

    if (!post.fileUrl) {
      throw new Error("Post is not a resource post");
    }

    return post;
  }
}
