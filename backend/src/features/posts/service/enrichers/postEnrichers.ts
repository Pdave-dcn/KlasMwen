import PostRepository from "../repositories/postRepository";

import type {
  BookmarkAndLikeStates,
  TransformedPost,
  PostPreview,
  EnrichedPost,
  EnrichedPostPreview,
} from "../types/postTypes";

/**
 * PostEnricher - Adds user-specific state (bookmarks, likes) to posts
 */
class PostEnricher {
  /**
   * Fetch bookmark and like states for a list of posts
   */
  static async getBookmarkAndLikeStates(
    userId: string,
    postIds: string[]
  ): Promise<BookmarkAndLikeStates> {
    if (postIds.length === 0) {
      return {
        bookmarkedPostIds: new Set<string>(),
        likedPostIds: new Set<string>(),
      };
    }

    const [bookmarks, likes] = await Promise.all([
      PostRepository.findBookmarksForPosts(userId, postIds),
      PostRepository.findLikesForPosts(userId, postIds),
    ]);

    return {
      bookmarkedPostIds: new Set(bookmarks.map((b) => b.postId)),
      likedPostIds: new Set(likes.map((l) => l.postId)),
    };
  }

  /**
   * Enrich posts with bookmark and like state flags
   */
  static enrichPostsWithStates(
    posts: TransformedPost[] | PostPreview[],
    states: BookmarkAndLikeStates,
    currentUserId: string
  ): (EnrichedPost | EnrichedPostPreview)[] {
    return posts.map((post) => ({
      ...post,
      isBookmarked: currentUserId
        ? states.bookmarkedPostIds.has(post.id)
        : false,
      isLiked: currentUserId ? states.likedPostIds.has(post.id) : false,
    }));
  }

  /**
   * Enrich a single post with bookmark and like state
   */
  static async enrichSinglePost(
    post: TransformedPost,
    currentUserId: string
  ): Promise<EnrichedPost> {
    const [bookmark, like] = await Promise.all([
      PostRepository.findBookmark(currentUserId, post.id),
      PostRepository.findLike(currentUserId, post.id),
    ]);

    return {
      ...post,
      isBookmarked: !!bookmark,
      isLiked: !!like,
    };
  }

  /**
   * Enrich posts with specific states (for liked/bookmarked feeds)
   * Used when all posts have the same like/bookmark state
   */
  static enrichPostsWithFixedStates(
    posts: TransformedPost[],
    isLiked: boolean,
    isBookmarked: boolean,
    otherStates: BookmarkAndLikeStates
  ): EnrichedPost[] {
    return posts.map((post) => ({
      ...post,
      isBookmarked: isBookmarked || otherStates.bookmarkedPostIds.has(post.id),
      isLiked: isLiked || otherStates.likedPostIds.has(post.id),
    }));
  }
}

export default PostEnricher;
