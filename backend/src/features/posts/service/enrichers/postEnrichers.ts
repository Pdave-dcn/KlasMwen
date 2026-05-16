import {
  postRepository,
  type IPostRepository,
} from "../repositories/postRepository.js";

import type {
  BookmarkAndLikeStates,
  TransformedPost,
  PostPreview,
  EnrichedPost,
  EnrichedPostPreview,
} from "../types/postTypes.js";

interface IPostEnricher {
  getBookmarkAndLikeStates(
    userId: string,
    postIds: string[],
  ): Promise<BookmarkAndLikeStates>;
  enrichPostsWithStates(
    posts: TransformedPost[] | PostPreview[],
    states: BookmarkAndLikeStates,
    currentUserId: string,
  ): (EnrichedPost | EnrichedPostPreview)[];
  enrichSinglePost(
    post: TransformedPost,
    currentUserId: string,
  ): Promise<EnrichedPost>;
  enrichPostsWithFixedStates(
    posts: TransformedPost[],
    isLiked: boolean,
    isBookmarked: boolean,
    otherStates: BookmarkAndLikeStates,
  ): EnrichedPost[];
}

class PostEnricher implements IPostEnricher {
  constructor(private repository: IPostRepository) {}

  async getBookmarkAndLikeStates(
    userId: string,
    postIds: string[],
  ): Promise<BookmarkAndLikeStates> {
    if (postIds.length === 0) {
      return {
        bookmarkedPostIds: new Set<string>(),
        likedPostIds: new Set<string>(),
      };
    }

    const [bookmarks, likes] = await Promise.all([
      this.repository.query.findBookmarksForPosts(userId, postIds),
      this.repository.query.findLikesForPosts(userId, postIds),
    ]);

    return {
      bookmarkedPostIds: new Set(bookmarks.map((b) => b.postId)),
      likedPostIds: new Set(likes.map((l) => l.postId)),
    };
  }

  enrichPostsWithStates(
    posts: TransformedPost[] | PostPreview[],
    states: BookmarkAndLikeStates,
    currentUserId: string,
  ): (EnrichedPost | EnrichedPostPreview)[] {
    return posts.map((post) => ({
      ...post,
      isBookmarked: currentUserId
        ? states.bookmarkedPostIds.has(post.id)
        : false,
      isLiked: currentUserId ? states.likedPostIds.has(post.id) : false,
    }));
  }

  async enrichSinglePost(
    post: TransformedPost,
    currentUserId: string,
  ): Promise<EnrichedPost> {
    const [bookmark, like] = await Promise.all([
      this.repository.query.findBookmark(currentUserId, post.id),
      this.repository.query.findLike(currentUserId, post.id),
    ]);

    return {
      ...post,
      isBookmarked: !!bookmark,
      isLiked: !!like,
    };
  }

  enrichPostsWithFixedStates(
    posts: TransformedPost[],
    isLiked: boolean,
    isBookmarked: boolean,
    otherStates: BookmarkAndLikeStates,
  ): EnrichedPost[] {
    return posts.map((post) => ({
      ...post,
      isBookmarked: isBookmarked || otherStates.bookmarkedPostIds.has(post.id),
      isLiked: isLiked || otherStates.likedPostIds.has(post.id),
    }));
  }
}

const postEnricher = new PostEnricher(postRepository);
export { postEnricher, type IPostEnricher };
