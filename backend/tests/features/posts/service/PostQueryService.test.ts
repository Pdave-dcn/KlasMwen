import { describe, it, expect, vi, beforeEach } from "vitest";

import { postQueryService } from "../../../../src/features/posts/service/core/PostQueryService.js";
import { PostNotFoundError } from "../../../../src/core/error/custom/post.error.js";

const mockFindManyPosts = vi.fn();
const mockCountPosts = vi.fn();
const mockFindUserLikes = vi.fn();
const mockFindUserBookmarks = vi.fn();
const mockFindPostById = vi.fn();
const mockFindExtendedPostById = vi.fn();

const mockTransformPostsWithTruncation = vi.fn();
const mockTransformPosts = vi.fn();
const mockTransformPost = vi.fn();

const mockGetBookmarkAndLikeStates = vi.fn();
const mockEnrichPostsWithStates = vi.fn();
const mockEnrichPostsWithFixedStates = vi.fn();
const mockEnrichSinglePost = vi.fn();

vi.mock(
  "../../../../src/features/posts/service/repositories/postRepository.js",
  () => ({
    postRepository: {
      query: {
        findManyPosts: (...args: unknown[]) => mockFindManyPosts(...args),
        countPosts: (...args: unknown[]) => mockCountPosts(...args),
        findUserLikes: (...args: unknown[]) => mockFindUserLikes(...args),
        findUserBookmarks: (...args: unknown[]) =>
          mockFindUserBookmarks(...args),
        findPostById: (...args: unknown[]) => mockFindPostById(...args),
        findExtendedPostById: (...args: unknown[]) =>
          mockFindExtendedPostById(...args),
      },
    },
  }),
);

vi.mock(
  "../../../../src/features/posts/service/transformers/postTransformers.js",
  () => ({
    postTransformer: {
      transformPostsWithTruncation: (...args: unknown[]) =>
        mockTransformPostsWithTruncation(...args),
      transformPosts: (...args: unknown[]) => mockTransformPosts(...args),
      transformPost: (...args: unknown[]) => mockTransformPost(...args),
    },
  }),
);

vi.mock(
  "../../../../src/features/posts/service/enrichers/postEnrichers.js",
  () => ({
    postEnricher: {
      getBookmarkAndLikeStates: (...args: unknown[]) =>
        mockGetBookmarkAndLikeStates(...args),
      enrichPostsWithStates: (...args: unknown[]) =>
        mockEnrichPostsWithStates(...args),
      enrichPostsWithFixedStates: (...args: unknown[]) =>
        mockEnrichPostsWithFixedStates(...args),
      enrichSinglePost: (...args: unknown[]) => mockEnrichSinglePost(...args),
    },
  }),
);

import type { BasePost } from "../../../../src/features/posts/service/types/postTypes.js";

const makeBasePost = (id = "p1"): BasePost => ({
  id,
  title: `Post ${id}`,
  content: "content",
  type: "NOTE",
  fileUrl: null,
  fileName: null,
  createdAt: new Date("2024-01-01"),
  author: { id: "u1", username: "user", Avatar: null },
  postTags: [],
  _count: { comments: 0, likes: 0 },
});

const makePreview = (id = "p1") => ({
  id,
  title: `Post ${id}`,
  content: "truncated",
  type: "NOTE" as const,
  fileUrl: null,
  fileName: null,
  fileSize: null,
  mimeType: null,
  createdAt: new Date("2024-01-01"),
  author: { id: "u1", username: "user", Avatar: null },
  tags: [],
  _count: { comments: 0, likes: 0 },
});

const makeEnriched = (id = "p1") => ({
  ...makePreview(id),
  isBookmarked: false,
  isLiked: false,
});

describe("PostQueryService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAllPosts", () => {
    it("should fetch all posts and return enriched paginated result", async () => {
      const posts = [makeBasePost("p1"), makeBasePost("p2")];
      const previews = [makePreview("p1"), makePreview("p2")];
      const states = {
        bookmarkedPostIds: new Set<string>(["p1"]),
        likedPostIds: new Set<string>(),
      };
      const enriched = previews.map((p, i) => ({
        ...p,
        isBookmarked: i === 0,
        isLiked: false,
      }));

      mockFindManyPosts.mockResolvedValue(posts);
      mockTransformPostsWithTruncation.mockResolvedValue(previews);
      mockGetBookmarkAndLikeStates.mockResolvedValue(states);
      mockEnrichPostsWithStates.mockReturnValue(enriched);

      const result = await postQueryService.getAllPosts("u1", 10);

      expect(mockFindManyPosts).toHaveBeenCalledWith({}, 10, undefined);
      expect(mockTransformPostsWithTruncation).toHaveBeenCalledWith(posts);
      expect(result.posts).toEqual(enriched);
      expect(result.pagination).toHaveProperty("nextCursor");
      expect(result.pagination).toHaveProperty("hasMore");
    });

    it("should pass cursor to repository", async () => {
      mockFindManyPosts.mockResolvedValue([]);
      mockTransformPostsWithTruncation.mockResolvedValue([]);
      mockGetBookmarkAndLikeStates.mockResolvedValue({
        bookmarkedPostIds: new Set(),
        likedPostIds: new Set(),
      });
      mockEnrichPostsWithStates.mockReturnValue([]);

      await postQueryService.getAllPosts("u1", 5, "cursor-abc");

      expect(mockFindManyPosts).toHaveBeenCalledWith({}, 5, "cursor-abc");
    });

    it("should handle empty result set", async () => {
      mockFindManyPosts.mockResolvedValue([]);
      mockTransformPostsWithTruncation.mockResolvedValue([]);
      mockGetBookmarkAndLikeStates.mockResolvedValue({
        bookmarkedPostIds: new Set(),
        likedPostIds: new Set(),
      });
      mockEnrichPostsWithStates.mockReturnValue([]);

      const result = await postQueryService.getAllPosts("u1", 10);

      expect(result.posts).toEqual([]);
      expect(result.pagination).toBeDefined();
    });
  });

  describe("getUserPosts", () => {
    it("should return user posts with total count", async () => {
      const posts = [makeBasePost("p1")];
      const previews = [makePreview("p1")];
      const states = {
        bookmarkedPostIds: new Set<string>(),
        likedPostIds: new Set<string>(),
      };
      const enriched = [
        { ...previews[0], isBookmarked: false, isLiked: false },
      ];

      mockFindManyPosts.mockResolvedValue(posts);
      mockCountPosts.mockResolvedValue(1);
      mockTransformPostsWithTruncation.mockResolvedValue(previews);
      mockGetBookmarkAndLikeStates.mockResolvedValue(states);
      mockEnrichPostsWithStates.mockReturnValue(enriched);

      const result = await postQueryService.getUserPosts("u1", 10);

      expect(mockFindManyPosts).toHaveBeenCalledWith(
        { authorId: "u1" },
        10,
        undefined,
      );
      expect(mockCountPosts).toHaveBeenCalledWith({ authorId: "u1" });
      expect(result.pagination.totalPosts).toBe(1);
    });
  });

  describe("getUserMediaPosts", () => {
    it("should query with content: null filter", async () => {
      mockFindManyPosts.mockResolvedValue([]);
      mockTransformPostsWithTruncation.mockResolvedValue([]);
      mockGetBookmarkAndLikeStates.mockResolvedValue({
        bookmarkedPostIds: new Set(),
        likedPostIds: new Set(),
      });
      mockEnrichPostsWithStates.mockReturnValue([]);

      await postQueryService.getUserMediaPosts("u1", 10);

      expect(mockFindManyPosts).toHaveBeenCalledWith(
        { authorId: "u1", content: null },
        10,
        undefined,
      );
    });
  });

  describe("getUserLikedPosts", () => {
    it("should fetch liked posts and mark with fixed liked state", async () => {
      const likes = [
        { post: makeBasePost("p1") },
        { post: makeBasePost("p2") },
      ];
      const posts = [makeBasePost("p1"), makeBasePost("p2")];
      const transformed = [
        { ...makeBasePost("p1"), tags: [], postTags: undefined },
        { ...makeBasePost("p2"), tags: [], postTags: undefined },
      ];
      const states = {
        bookmarkedPostIds: new Set<string>(["p1"]),
        likedPostIds: new Set<string>(),
      };
      const enriched = transformed.map((p, i) => ({
        ...p,
        isBookmarked: i === 0,
        isLiked: true,
      }));

      mockFindUserLikes.mockResolvedValue(likes);
      mockTransformPosts.mockReturnValue(transformed);
      mockGetBookmarkAndLikeStates.mockResolvedValue(states);
      mockEnrichPostsWithFixedStates.mockReturnValue(enriched);

      const result = await postQueryService.getUserLikedPosts("u1", 10);

      expect(mockFindUserLikes).toHaveBeenCalledWith("u1", 10, undefined);
      expect(mockTransformPosts).toHaveBeenCalledWith(posts);
      expect(mockEnrichPostsWithFixedStates).toHaveBeenCalledWith(
        transformed,
        true,
        false,
        states,
      );
      expect(result.posts).toBeDefined();
    });
  });

  describe("getUserBookmarkedPosts", () => {
    it("should fetch bookmarked posts and mark with fixed bookmark state", async () => {
      const bookmarks = [
        { post: makeBasePost("p1") },
        { post: makeBasePost("p2") },
      ];
      const posts = [makeBasePost("p1"), makeBasePost("p2")];
      const transformed = [
        { ...makeBasePost("p1"), tags: [], postTags: undefined },
        { ...makeBasePost("p2"), tags: [], postTags: undefined },
      ];
      const states = {
        bookmarkedPostIds: new Set<string>(),
        likedPostIds: new Set<string>(["p1"]),
      };
      const enriched = transformed.map((p, i) => ({
        ...p,
        isBookmarked: true,
        isLiked: i === 0,
      }));

      mockFindUserBookmarks.mockResolvedValue(bookmarks);
      mockTransformPosts.mockReturnValue(transformed);
      mockGetBookmarkAndLikeStates.mockResolvedValue(states);
      mockEnrichPostsWithFixedStates.mockReturnValue(enriched);

      const result = await postQueryService.getUserBookmarkedPosts("u1", 10);

      expect(mockFindUserBookmarks).toHaveBeenCalledWith("u1", 10, undefined);
      expect(mockEnrichPostsWithFixedStates).toHaveBeenCalledWith(
        transformed,
        false,
        true,
        states,
      );
      expect(result.posts).toBeDefined();
    });
  });

  describe("getPostById", () => {
    it("should return enriched post", async () => {
      const post = makeBasePost("p1");
      const transformed = {
        ...post,
        tags: [],
        postTags: undefined,
      } as const;
      const enriched = { ...transformed, isBookmarked: true, isLiked: false };

      mockFindPostById.mockResolvedValue(post);
      mockTransformPost.mockReturnValue(transformed);
      mockEnrichSinglePost.mockResolvedValue(enriched);

      const result = await postQueryService.getPostById("p1", "u1");

      expect(mockFindPostById).toHaveBeenCalledWith("p1");
      expect(mockTransformPost).toHaveBeenCalledWith(post);
      expect(mockEnrichSinglePost).toHaveBeenCalledWith(transformed, "u1");
      expect(result).toBe(enriched);
    });

    it("should throw PostNotFoundError when not found", async () => {
      mockFindPostById.mockResolvedValue(null);

      await expect(
        postQueryService.getPostById("nonexistent", "u1"),
      ).rejects.toThrow(PostNotFoundError);
    });
  });

  describe("getResourcePostById", () => {
    it("should return post when it has fileUrl", async () => {
      const post = {
        id: "p1",
        title: "Resource",
        content: null,
        type: "RESOURCE" as const,
        fileUrl: "http://example.com/file.pdf",
        fileName: "file.pdf",
        fileSize: 1000,
        mimeType: "application/pdf",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
        author: { id: "u1", username: "user", Avatar: null },
        postTags: [],
        _count: { comments: 0, likes: 0 },
      };

      mockFindExtendedPostById.mockResolvedValue(post);

      const result = await postQueryService.getResourcePostById("p1");

      expect(mockFindExtendedPostById).toHaveBeenCalledWith("p1");
      expect(result).toBe(post);
    });

    it("should throw PostNotFoundError when not found", async () => {
      mockFindExtendedPostById.mockResolvedValue(null);

      await expect(
        postQueryService.getResourcePostById("nonexistent"),
      ).rejects.toThrow(PostNotFoundError);
    });

    it("should throw if post has no fileUrl", async () => {
      const post = {
        id: "p1",
        title: "Text",
        content: "hello",
        type: "NOTE" as const,
        fileUrl: null,
        fileName: null,
        fileSize: null,
        mimeType: null,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
        author: { id: "u1", username: "user", Avatar: null },
        postTags: [],
        _count: { comments: 0, likes: 0 },
      };

      mockFindExtendedPostById.mockResolvedValue(post);

      await expect(postQueryService.getResourcePostById("p1")).rejects.toThrow(
        "Post is not a resource post",
      );
    });
  });
});
