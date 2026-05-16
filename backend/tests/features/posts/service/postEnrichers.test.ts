import { describe, it, expect, vi, beforeEach } from "vitest";

import { postEnricher } from "../../../../src/features/posts/service/enrichers/postEnrichers.js";

const mockFindBookmarksForPosts = vi.fn();
const mockFindLikesForPosts = vi.fn();
const mockFindBookmark = vi.fn();
const mockFindLike = vi.fn();

vi.mock(
  "../../../../src/features/posts/service/repositories/postRepository.js",
  () => ({
    postRepository: {
      query: {
        findBookmarksForPosts: (...args: unknown[]) =>
          mockFindBookmarksForPosts(...args),
        findLikesForPosts: (...args: unknown[]) =>
          mockFindLikesForPosts(...args),
        findBookmark: (...args: unknown[]) => mockFindBookmark(...args),
        findLike: (...args: unknown[]) => mockFindLike(...args),
      },
    },
  }),
);

import type {
  TransformedPost,
  PostPreview,
} from "../../../../src/features/posts/service/types/postTypes.js";

const makePost = (id = "p1"): TransformedPost => ({
  id,
  title: "Post",
  content: "content",
  type: "NOTE",
  fileUrl: null,
  fileName: null,
  fileSize: null,
  mimeType: null,
  createdAt: new Date("2024-01-01"),
  updatedAt: undefined,
  author: { id: "u1", username: "user", Avatar: null },
  tags: [],
  _count: { comments: 0, likes: 0 },
});

const makePreview = (id = "p1"): PostPreview => ({
  id,
  title: "Post",
  content: "truncated",
  type: "NOTE",
  fileUrl: null,
  fileName: null,
  createdAt: new Date("2024-01-01"),
  author: { id: "u1", username: "user", Avatar: null },
  tags: [],
  _count: { comments: 0, likes: 0 },
});

describe("PostEnricher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getBookmarkAndLikeStates", () => {
    it("should return empty sets when postIds is empty", async () => {
      const result = await postEnricher.getBookmarkAndLikeStates("u1", []);

      expect(result).toEqual({
        bookmarkedPostIds: new Set(),
        likedPostIds: new Set(),
      });
      expect(mockFindBookmarksForPosts).not.toHaveBeenCalled();
    });

    it("should fetch bookmarks and likes and return sets", async () => {
      mockFindBookmarksForPosts.mockResolvedValue([
        { postId: "p1" },
        { postId: "p2" },
      ]);
      mockFindLikesForPosts.mockResolvedValue([{ postId: "p1" }]);

      const result = await postEnricher.getBookmarkAndLikeStates("u1", [
        "p1",
        "p2",
        "p3",
      ]);

      expect(mockFindBookmarksForPosts).toHaveBeenCalledWith("u1", [
        "p1",
        "p2",
        "p3",
      ]);
      expect(mockFindLikesForPosts).toHaveBeenCalledWith("u1", [
        "p1",
        "p2",
        "p3",
      ]);
      expect(result.bookmarkedPostIds).toEqual(new Set(["p1", "p2"]));
      expect(result.likedPostIds).toEqual(new Set(["p1"]));
    });
  });

  describe("enrichPostsWithStates", () => {
    it("should mark bookmarked and liked posts", () => {
      const posts = [makePost("p1"), makePost("p2")];
      const states = {
        bookmarkedPostIds: new Set(["p1"]),
        likedPostIds: new Set(["p2"]),
      };

      const result = postEnricher.enrichPostsWithStates(posts, states, "u1");

      expect(result[0]).toMatchObject({
        id: "p1",
        isBookmarked: true,
        isLiked: false,
      });
      expect(result[1]).toMatchObject({
        id: "p2",
        isBookmarked: false,
        isLiked: true,
      });
    });

    it("should set false flags when currentUserId is empty", () => {
      const posts = [makePost("p1")];
      const states = {
        bookmarkedPostIds: new Set(["p1"]),
        likedPostIds: new Set(["p1"]),
      };

      const result = postEnricher.enrichPostsWithStates(posts, states, "");

      expect(result[0]).toMatchObject({
        id: "p1",
        isBookmarked: false,
        isLiked: false,
      });
    });

    it("should handle PostPreview input", () => {
      const previews = [makePreview("p1")];
      const states = {
        bookmarkedPostIds: new Set<string>(),
        likedPostIds: new Set<string>(),
      };

      const result = postEnricher.enrichPostsWithStates(previews, states, "u1");

      expect(result[0]).toMatchObject({ id: "p1" });
    });
  });

  describe("enrichSinglePost", () => {
    it("should enrich single post with bookmark and like state", async () => {
      const post = makePost("p1");
      mockFindBookmark.mockResolvedValue({ id: 1 });
      mockFindLike.mockResolvedValue(null);

      const result = await postEnricher.enrichSinglePost(post, "u1");

      expect(mockFindBookmark).toHaveBeenCalledWith("u1", "p1");
      expect(mockFindLike).toHaveBeenCalledWith("u1", "p1");
      expect(result).toMatchObject({
        id: "p1",
        isBookmarked: true,
        isLiked: false,
      });
    });
  });

  describe("enrichPostsWithFixedStates", () => {
    it("should apply fixed isLiked=True and union isBookmarked from otherStates", () => {
      const posts = [makePost("p1"), makePost("p2"), makePost("p3")];
      const otherStates = {
        bookmarkedPostIds: new Set(["p2"]),
        likedPostIds: new Set(["p3"]),
      };

      const result = postEnricher.enrichPostsWithFixedStates(
        posts,
        true,
        false,
        otherStates,
      );

      expect(result[0]).toMatchObject({
        id: "p1",
        isBookmarked: false,
        isLiked: true,
      });
      expect(result[1]).toMatchObject({
        id: "p2",
        isBookmarked: true,
        isLiked: true,
      });
      expect(result[2]).toMatchObject({
        id: "p3",
        isBookmarked: false,
        isLiked: true,
      });
    });
  });
});
