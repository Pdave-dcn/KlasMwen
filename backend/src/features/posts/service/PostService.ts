import {
  PostNotFoundError,
  PostUpdateFailedError,
} from "../../../core/error/custom/post.error";
import { processPaginatedResults } from "../../../utils/pagination.util";

import PostEnricher from "./enrichers/postEnrichers";
import PostRepository from "./repositories/postRepository";
import PostTransformer from "./transformers/postTransformers";

import type { PaginatedPostsResponse, RawPost } from "./types/postTypes";
import type { ValidatedPostUpdateData } from "../../../zodSchemas/post.zod";
import type { Prisma } from "@prisma/client";

class PostService {
  /**
   * Core method: Fetch, transform, enrich, and paginate posts
   * This private method is used by most public methods
   */
  private static async getPostsAndProcess(
    where: Prisma.PostWhereInput,
    limit: number,
    currentUserId: string,
    cursor?: string
  ): Promise<PaginatedPostsResponse> {
    const posts = await PostRepository.findManyPosts(where, limit, cursor);

    // Transform posts (flatten tags, truncate content)
    const transformedPosts = PostTransformer.transformPostsWithTruncation(
      posts as Partial<RawPost>[]
    );

    // Enrich with bookmark/like states
    const postIds = posts.map((p) => p.id);
    const states = await PostEnricher.getBookmarkAndLikeStates(
      currentUserId,
      postIds
    );
    const enrichedPosts = PostEnricher.enrichPostsWithStates(
      transformedPosts,
      states,
      currentUserId
    );

    const { data, pagination } = processPaginatedResults(
      enrichedPosts,
      limit,
      "id"
    );

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
   * Get all posts (feed)
   */
  static getAllPosts(
    userId: string,
    limit: number,
    cursor?: string
  ): Promise<PaginatedPostsResponse> {
    return this.getPostsAndProcess({}, limit, userId, cursor);
  }

  /**
   * Get posts by a specific user
   */
  static async getUserPosts(
    userId: string,
    limit: number,
    cursor?: string
  ): Promise<PaginatedPostsResponse> {
    const where = { authorId: userId };
    const result = await this.getPostsAndProcess(where, limit, userId, cursor);

    const totalCount = await PostRepository.countPosts(where);

    return {
      ...result,
      pagination: {
        ...result.pagination,
        totalPosts: totalCount,
      },
    };
  }

  /**
   * Get media posts by a specific user (posts without text content)
   */
  static getUserMediaPosts(
    userId: string,
    limit: number,
    cursor?: string
  ): Promise<PaginatedPostsResponse> {
    const where = { authorId: userId, content: null };
    return this.getPostsAndProcess(where, limit, userId, cursor);
  }

  static async getPostsBySearchTerm(
    userId: string,
    searchTerm: string,
    limit: number,
    cursor?: string
  ): Promise<PaginatedPostsResponse> {
    const searchCondition: Prisma.PostWhereInput = {
      OR: [
        {
          title: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
        {
          content: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
      ],
    };

    const result = await this.getPostsAndProcess(
      searchCondition,
      limit,
      userId,
      cursor
    );
    const totalCount = await PostRepository.countPosts(searchCondition);

    return {
      ...result,
      pagination: {
        ...result.pagination,
        totalPosts: totalCount,
      },
    };
  }

  /**
   * Get posts liked by a user
   */
  static async getUserLikedPosts(
    userId: string,
    limit: number,
    cursor?: string
  ): Promise<PaginatedPostsResponse> {
    const likes = await PostRepository.findUserLikes(userId, limit, cursor);
    const posts = likes.map((like) => like.post);

    const transformedPosts = PostTransformer.transformPosts(posts as RawPost[]);

    // Enrich with states (all are liked, check bookmarks)
    const postIds = posts.map((p) => p.id);
    const { bookmarkedPostIds } = await PostEnricher.getBookmarkAndLikeStates(
      userId,
      postIds
    );

    const enrichedPosts = PostEnricher.enrichPostsWithFixedStates(
      transformedPosts,
      true, // isLiked = true
      false, // isBookmarked depends on state
      { bookmarkedPostIds, likedPostIds: new Set() }
    );

    const { data, pagination } = processPaginatedResults(enrichedPosts, limit);

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
   * Get posts bookmarked by a user
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

    const transformedPosts = PostTransformer.transformPosts(
      posts as Partial<RawPost>[]
    );

    // Enrich with states (all are bookmarked, check likes)
    const postIds = posts.map((p) => p.id);
    const { likedPostIds } = await PostEnricher.getBookmarkAndLikeStates(
      userId,
      postIds
    );

    const enrichedPosts = PostEnricher.enrichPostsWithFixedStates(
      transformedPosts,
      false, // isLiked depends on state
      true, // isBookmarked = true
      { bookmarkedPostIds: new Set(), likedPostIds }
    );

    const { data, pagination } = processPaginatedResults(enrichedPosts, limit);

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
   * Get a single post by ID
   * @throws {PostNotFoundError} if post not found
   */
  static async getPostById(postId: string, currentUserId: string) {
    const post = await PostRepository.findPostById(postId);

    if (!post) {
      throw new PostNotFoundError(postId);
    }

    const transformedPost = PostTransformer.transformPost(post as RawPost);

    // Enrich with states
    const enrichedPost = await PostEnricher.enrichSinglePost(
      transformedPost,
      currentUserId
    );

    return enrichedPost;
  }

  /**
   * Get post for editing
   * @throws {PostNotFoundError} if post not found
   */
  static async getPostForEdit(postId: string) {
    const post = await PostRepository.findPostForEdit(postId);

    if (!post) {
      throw new PostNotFoundError(postId);
    }

    return post;
  }

  /**
   * Update a post
   * @throws {PostUpdateFailedError} if update fails
   */
  static async handlePostUpdate(
    validatedData: ValidatedPostUpdateData,
    postId: string
  ) {
    const updateData =
      validatedData.type === "RESOURCE"
        ? { title: validatedData.title }
        : { title: validatedData.title, content: validatedData.content };

    const tagIds = validatedData.tagIds || [];

    const updatedPost = await PostRepository.updatePost(
      postId,
      updateData,
      tagIds
    );

    if (!updatedPost) {
      throw new PostUpdateFailedError(postId);
    }

    return updatedPost;
  }

  /**
   * Get post metadata
   * @throws {PostNotFoundError} if post not found
   */
  static async getPostMetadata(postId: string) {
    const metadata = await PostRepository.findPostMetadata(postId);

    if (!metadata) {
      throw new Error("Post not found");
    }

    return metadata;
  }
}

export default PostService;
