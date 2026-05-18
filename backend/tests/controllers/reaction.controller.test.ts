import { it, expect, describe, vi, beforeEach } from "vitest";

import { PostNotFoundError } from "../../src/core/error/custom/post.error.js";
import { toggleLike } from "../../src/controllers/reaction.controller.js";

const mockToggleLike = vi.fn();

vi.mock("../../src/features/reaction/service/index.js", () => ({
  reactionService: {
    toggleLike: (...args: unknown[]) => mockToggleLike(...args),
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

describe("Reaction Controller", () => {
  let mockRequest: MockReq;
  let mockResponse: MockRes;
  let mockNext: MockNext;
  const mockUserId = "c3d4e5f6-7890-4b78-8a90-90abcdef1234";
  const mockPostId = "550e8400-e29b-41d4-a716-446655440000";

  beforeEach(() => {
    vi.clearAllMocks();
    mockResponse = createRes();
    mockNext = vi.fn();
  });

  describe("toggleLike", () => {
    it("should like a post successfully", async () => {
      mockRequest = createReq({
        user: { id: mockUserId, role: "STUDENT" },
        params: { id: mockPostId },
      });
      mockToggleLike.mockResolvedValue({
        action: "like",
        message: "Post liked successfully",
      });

      await toggleLike(mockRequest as any, mockResponse as any, mockNext);

      expect(mockToggleLike).toHaveBeenCalledWith(mockUserId, mockPostId, undefined);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Post liked successfully",
      });
    });

    it("should unlike a post successfully", async () => {
      mockRequest = createReq({
        user: { id: mockUserId, role: "STUDENT" },
        params: { id: mockPostId },
      });
      mockToggleLike.mockResolvedValue({
        action: "unlike",
        message: "Post unliked successfully",
      });

      await toggleLike(mockRequest as any, mockResponse as any, mockNext);

      expect(mockToggleLike).toHaveBeenCalledWith(mockUserId, mockPostId, undefined);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Post unliked successfully",
      });
    });

    it("should call next with PostNotFoundError when post does not exist", async () => {
      mockRequest = createReq({
        user: { id: mockUserId, role: "STUDENT" },
        params: { id: mockPostId },
      });
      mockToggleLike.mockRejectedValue(new PostNotFoundError(mockPostId));

      await toggleLike(mockRequest as any, mockResponse as any, mockNext);

      expect(mockToggleLike).toHaveBeenCalledWith(mockUserId, mockPostId, undefined);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(PostNotFoundError));
    });

    it("should call next with validation error for invalid post ID", async () => {
      mockRequest = createReq({
        user: { id: mockUserId, role: "STUDENT" },
        params: { id: "invalid-uuid" },
      });

      await toggleLike(mockRequest as any, mockResponse as any, mockNext);

      expect(mockToggleLike).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it("should handle service errors", async () => {
      const dbError = new Error("Database connection failed");
      mockRequest = createReq({
        user: { id: mockUserId, role: "STUDENT" },
        params: { id: mockPostId },
      });
      mockToggleLike.mockRejectedValue(dbError);

      await toggleLike(mockRequest as any, mockResponse as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(dbError);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });
});
