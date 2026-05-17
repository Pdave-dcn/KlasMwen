import { describe, it, expect, vi, beforeEach } from "vitest";

import { BookmarkNotFoundError } from "../../../../src/core/error/custom/bookmark.error.js";
import { PostNotFoundError } from "../../../../src/core/error/custom/post.error.js";

const mockGetUserBookmarkedPosts = vi.fn();
const mockVerifyPostExists = vi.fn();
const mockFindByUserAndPost = vi.fn();
const mockCreate = vi.fn();
const mockDelete = vi.fn();

vi.mock("../../../../src/features/posts/service/PostService.js", () => ({
  postService: {
    query: {
      getUserBookmarkedPosts: (...args: unknown[]) =>
        mockGetUserBookmarkedPosts(...args),
    },
    validate: {
      verifyPostExists: (...args: unknown[]) => mockVerifyPostExists(...args),
    },
  },
}));

vi.mock(
  "../../../../src/features/bookmark/service/repositories/bookmarkRepository.js",
  () => ({
    BookmarkRepository: {
      findByUserAndPost: (...args: unknown[]) => mockFindByUserAndPost(...args),
      create: (...args: unknown[]) => mockCreate(...args),
      delete: (...args: unknown[]) => mockDelete(...args),
    },
  }),
);

import { bookmarkService } from "../../../../src/features/bookmark/service/index.js";

const mockUserId = "c3d4e5f6-7890-1234-5678-90abcdef1234";
const mockPostId = "550e8400-e29b-41d4-a716-446655440000";

describe("BookmarkService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getBookmarks", () => {
    it("should return paginated bookmarks", async () => {
      const mockResult = {
        posts: [{ id: mockPostId, title: "Test Post" }],
        pagination: { hasMore: false, nextCursor: null },
      };
      mockGetUserBookmarkedPosts.mockResolvedValue(mockResult);

      const result = await bookmarkService.getBookmarks(mockUserId, 10);

      expect(mockGetUserBookmarkedPosts).toHaveBeenCalledWith(
        mockUserId, 10, undefined,
      );
      expect(result).toEqual({
        data: mockResult.posts,
        pagination: mockResult.pagination,
      });
    });

    it("should pass cursor to post service", async () => {
      const mockResult = {
        posts: [],
        pagination: { hasMore: false, nextCursor: null },
      };
      mockGetUserBookmarkedPosts.mockResolvedValue(mockResult);

      await bookmarkService.getBookmarks(mockUserId, 5, "cursor-id");

      expect(mockGetUserBookmarkedPosts).toHaveBeenCalledWith(
        mockUserId, 5, "cursor-id",
      );
    });
  });

  describe("createBookmark", () => {
    it("should verify post exists and create bookmark", async () => {
      mockVerifyPostExists.mockResolvedValue({ id: mockPostId });
      mockCreate.mockResolvedValue({ userId: mockUserId, postId: mockPostId });

      await bookmarkService.createBookmark(mockUserId, mockPostId);

      expect(mockVerifyPostExists).toHaveBeenCalledWith(mockPostId);
      expect(mockCreate).toHaveBeenCalledWith(mockUserId, mockPostId);
    });

    it("should throw when post does not exist", async () => {
      mockVerifyPostExists.mockRejectedValue(
        new PostNotFoundError(mockPostId),
      );

      await expect(
        bookmarkService.createBookmark(mockUserId, mockPostId),
      ).rejects.toThrow(PostNotFoundError);

      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  describe("deleteBookmark", () => {
    it("should delete existing bookmark", async () => {
      mockFindByUserAndPost.mockResolvedValue({
        userId: mockUserId,
        postId: mockPostId,
      });
      mockDelete.mockResolvedValue({});

      await bookmarkService.deleteBookmark(mockUserId, mockPostId);

      expect(mockFindByUserAndPost).toHaveBeenCalledWith(mockUserId, mockPostId);
      expect(mockDelete).toHaveBeenCalledWith(mockUserId, mockPostId);
    });

    it("should throw when bookmark does not exist", async () => {
      mockFindByUserAndPost.mockResolvedValue(null);

      await expect(
        bookmarkService.deleteBookmark(mockUserId, mockPostId),
      ).rejects.toThrow(BookmarkNotFoundError);

      expect(mockDelete).not.toHaveBeenCalled();
    });
  });
});
