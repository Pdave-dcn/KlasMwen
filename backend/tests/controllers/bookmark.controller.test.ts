import { it, expect, describe, vi, beforeEach } from "vitest";

import { BookmarkNotFoundError } from "../../src/core/error/custom/bookmark.error.js";
import { PostNotFoundError } from "../../src/core/error/custom/post.error.js";
import {
  createBookmark,
  deleteBookmark,
  getBookmarks,
} from "../../src/controllers/bookmark.controller.js";

const mockGetBookmarks = vi.fn();
const mockCreateBookmark = vi.fn();
const mockDeleteBookmark = vi.fn();

vi.mock("../../src/features/bookmark/service/index.js", () => ({
  bookmarkService: {
    getBookmarks: (...args: unknown[]) => mockGetBookmarks(...args),
    createBookmark: (...args: unknown[]) => mockCreateBookmark(...args),
    deleteBookmark: (...args: unknown[]) => mockDeleteBookmark(...args),
  },
}));

vi.mock("../../src/core/config/logger.js", () => ({
  createLogger: vi.fn(() => ({
    child: vi.fn(() => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    })),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

type MockReq = Record<string, unknown>;
type MockRes = { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn> };
type MockNext = ReturnType<typeof vi.fn>;

function createReq(overrides: Record<string, unknown> = {}): MockReq {
  return {
    params: {},
    body: {},
    query: {},
    ...overrides,
  };
}

function createRes(): MockRes {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
}

describe("Bookmark Controller", () => {
  let mockRequest: MockReq;
  let mockResponse: MockRes;
  let mockNext: MockNext;
  const mockUserId = "c3d4e5f6-7890-1234-5678-90abcdef1234";
  const mockPostId = "550e8400-e29b-41d4-a716-446655440000";

  beforeEach(() => {
    vi.clearAllMocks();
    mockResponse = createRes();
    mockNext = vi.fn();
  });

  describe("createBookmark", () => {
    it("should create a bookmark successfully", async () => {
      mockRequest = createReq({
        user: { id: mockUserId, role: "STUDENT", username: "test_username", email: "test_email" },
        params: { id: mockPostId },
      });
      mockCreateBookmark.mockResolvedValue(undefined);

      await createBookmark(
        mockRequest as any, mockResponse as any, mockNext,
      );

      expect(mockCreateBookmark).toHaveBeenCalledWith(mockUserId, mockPostId);
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Post bookmarked successfully",
      });
    });

    it("should call next with PostNotFoundError when post does not exist", async () => {
      mockRequest = createReq({
        user: { id: mockUserId, role: "STUDENT", username: "test_username", email: "test_email" },
        params: { id: mockPostId },
      });
      mockCreateBookmark.mockRejectedValue(new PostNotFoundError(mockPostId));

      await createBookmark(
        mockRequest as any, mockResponse as any, mockNext,
      );

      expect(mockCreateBookmark).toHaveBeenCalledWith(mockUserId, mockPostId);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(PostNotFoundError));
    });

    it("should call next with validation error for invalid post ID", async () => {
      mockRequest = createReq({
        user: { id: mockUserId, role: "STUDENT", username: "test_username", email: "test_email" },
        params: { id: "invalid-uuid" },
      });

      await createBookmark(
        mockRequest as any, mockResponse as any, mockNext,
      );

      expect(mockCreateBookmark).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it("should handle database errors", async () => {
      const dbError = new Error("Database connection failed");
      mockRequest = createReq({
        user: { id: mockUserId, role: "STUDENT", username: "test_username", email: "test_email" },
        params: { id: mockPostId },
      });
      mockCreateBookmark.mockRejectedValue(dbError);

      await createBookmark(
        mockRequest as any, mockResponse as any, mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(dbError);
    });
  });

  describe("deleteBookmark", () => {
    it("should delete a bookmark successfully", async () => {
      mockRequest = createReq({
        user: { id: mockUserId, role: "STUDENT", username: "test_username", email: "test_email" },
        params: { id: mockPostId },
      });
      mockDeleteBookmark.mockResolvedValue(undefined);

      await deleteBookmark(
        mockRequest as any, mockResponse as any, mockNext,
      );

      expect(mockDeleteBookmark).toHaveBeenCalledWith(mockUserId, mockPostId);
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Bookmark removed successfully",
      });
    });

    it("should call next with BookmarkNotFoundError when bookmark does not exist", async () => {
      mockRequest = createReq({
        user: { id: mockUserId, role: "STUDENT", username: "test_username", email: "test_email" },
        params: { id: mockPostId },
      });
      mockDeleteBookmark.mockRejectedValue(new BookmarkNotFoundError(mockPostId));

      await deleteBookmark(
        mockRequest as any, mockResponse as any, mockNext,
      );

      expect(mockDeleteBookmark).toHaveBeenCalledWith(mockUserId, mockPostId);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(BookmarkNotFoundError));
    });

    it("should call next with validation error for invalid post ID", async () => {
      mockRequest = createReq({
        user: { id: mockUserId, role: "STUDENT", username: "test_username", email: "test_email" },
        params: { id: "invalid-uuid" },
      });

      await deleteBookmark(
        mockRequest as any, mockResponse as any, mockNext,
      );

      expect(mockDeleteBookmark).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it("should handle database errors", async () => {
      const dbError = new Error("Database connection failed");
      mockRequest = createReq({
        user: { id: mockUserId, role: "STUDENT", username: "test_username", email: "test_email" },
        params: { id: mockPostId },
      });
      mockDeleteBookmark.mockRejectedValue(dbError);

      await deleteBookmark(
        mockRequest as any, mockResponse as any, mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(dbError);
    });
  });

  describe("getBookmarks", () => {
    it("should get bookmarks successfully with default pagination", async () => {
      mockRequest = createReq({
        query: {},
        user: { id: mockUserId, role: "STUDENT", username: "test_username", email: "test_email" },
      });
      const mockResult = {
        data: [{ id: mockPostId, title: "Test Post" }],
        pagination: { hasMore: false, nextCursor: null },
      };
      mockGetBookmarks.mockResolvedValue(mockResult);

      await getBookmarks(
        mockRequest as any, mockResponse as any, mockNext,
      );

      expect(mockGetBookmarks).toHaveBeenCalledWith(mockUserId, 10, undefined);
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it("should get bookmarks with custom limit", async () => {
      mockRequest = createReq({
        query: { limit: "5" },
        user: { id: mockUserId, role: "STUDENT", username: "test_username", email: "test_email" },
      });
      const mockResult = {
        data: [{ id: mockPostId, title: "Test Post" }],
        pagination: { hasMore: false, nextCursor: null },
      };
      mockGetBookmarks.mockResolvedValue(mockResult);

      await getBookmarks(
        mockRequest as any, mockResponse as any, mockNext,
      );

      expect(mockGetBookmarks).toHaveBeenCalledWith(mockUserId, 5, undefined);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it("should get bookmarks with cursor pagination", async () => {
      const mockCursor = "660e8400-e29b-41d4-a716-446655440001";
      mockRequest = createReq({
        query: { cursor: mockCursor },
        user: { id: mockUserId, role: "STUDENT", username: "test_username", email: "test_email" },
      });
      const mockResult = {
        data: [{ id: mockPostId, title: "Test Post" }],
        pagination: { hasMore: false, nextCursor: null },
      };
      mockGetBookmarks.mockResolvedValue(mockResult);

      await getBookmarks(
        mockRequest as any, mockResponse as any, mockNext,
      );

      expect(mockGetBookmarks).toHaveBeenCalledWith(mockUserId, 10, mockCursor);
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it("should call next with validation error for invalid limit", async () => {
      mockRequest = createReq({
        query: { limit: "invalid" },
        user: { id: mockUserId, role: "STUDENT", username: "test_username", email: "test_email" },
      });

      await getBookmarks(
        mockRequest as any, mockResponse as any, mockNext,
      );

      expect(mockGetBookmarks).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it("should call next with validation error for invalid cursor UUID", async () => {
      mockRequest = createReq({
        query: { cursor: "invalid-uuid" },
        user: { id: mockUserId, role: "STUDENT", username: "test_username", email: "test_email" },
      });

      await getBookmarks(
        mockRequest as any, mockResponse as any, mockNext,
      );

      expect(mockGetBookmarks).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it("should handle database errors", async () => {
      mockRequest = createReq({
        query: {},
        user: { id: mockUserId, role: "STUDENT", username: "test_username", email: "test_email" },
      });
      const dbError = new Error("Database connection failed");
      mockGetBookmarks.mockRejectedValue(dbError);

      await getBookmarks(
        mockRequest as any, mockResponse as any, mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(dbError);
    });

    it("should return empty array when user has no bookmarks", async () => {
      mockRequest = createReq({
        query: {},
        user: { id: mockUserId, role: "STUDENT", username: "test_username", email: "test_email" },
      });
      const mockResult = {
        data: [],
        pagination: { hasMore: false, nextCursor: null },
      };
      mockGetBookmarks.mockResolvedValue(mockResult);

      await getBookmarks(
        mockRequest as any, mockResponse as any, mockNext,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });
  });
});
