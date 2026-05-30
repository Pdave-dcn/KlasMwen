import { it, expect, describe, vi, beforeEach } from "vitest";

import {
  createComment,
  deleteComment,
  getParentComments,
  getReplies,
} from "../../src/controllers/comment.controller.js";
import { PostNotFoundError } from "../../src/core/error/custom/post.error.js";
import { CommentNotFoundError } from "../../src/core/error/custom/comment.error.js";

const mockGetUserCommentsWithRelations = vi.fn();
const mockGetParentComments = vi.fn();
const mockGetReplies = vi.fn();
const mockCreateComment = vi.fn();
const mockDeleteComment = vi.fn();
const mockCommentExists = vi.fn();

vi.mock("../../src/features/comment/service/index.js", () => ({
  commentService: {
    query: {
      getUserCommentsWithRelations: (...args: unknown[]) =>
        mockGetUserCommentsWithRelations(...args),
      getParentComments: (...args: unknown[]) =>
        mockGetParentComments(...args),
      getReplies: (...args: unknown[]) => mockGetReplies(...args),
    },
    command: {
      createComment: (...args: unknown[]) => mockCreateComment(...args),
      deleteComment: (...args: unknown[]) => mockDeleteComment(...args),
    },
    validate: {
      commentExists: (...args: unknown[]) => mockCommentExists(...args),
    },
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
type MockRes = {
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
};
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

const mockUserId = "c3d4e5f6-7890-1234-5678-90abcdef1234";
const mockPostId = "550e8400-e29b-41d4-a716-446655440000";

describe("Comment Controller", () => {
  let mockRequest: MockReq;
  let mockResponse: MockRes;
  let mockNext: MockNext;

  beforeEach(() => {
    vi.clearAllMocks();
    mockResponse = createRes();
    mockNext = vi.fn();
  });

  describe("createComment", () => {
    it("should create a root comment successfully", async () => {
      const newComment = { id: 1, content: "Great post!" };
      mockRequest = createReq({
        user: { id: mockUserId, role: "STUDENT" },
        params: { id: mockPostId },
        body: { content: "Great post!" },
      });
      mockCreateComment.mockResolvedValue(newComment);

      await createComment(mockRequest as any, mockResponse as any, mockNext);

      expect(mockCreateComment).toHaveBeenCalledWith(
        { content: "Great post!", authorId: mockUserId, postId: mockPostId },
      );
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Comment created successfully",
        data: newComment,
      });
    });

    it("should create a reply comment with parentId", async () => {
      mockRequest = createReq({
        user: { id: mockUserId, role: "STUDENT" },
        params: { id: mockPostId },
        body: { content: "A reply", parentId: 5 },
      });
      mockCreateComment.mockResolvedValue({ id: 6, content: "A reply" });

      await createComment(mockRequest as any, mockResponse as any, mockNext);

      expect(mockCreateComment).toHaveBeenCalledWith(
        { content: "A reply", authorId: mockUserId, postId: mockPostId, parentId: 5 },
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });

    it("should call next with PostNotFoundError when post does not exist", async () => {
      mockRequest = createReq({
        user: { id: mockUserId, role: "STUDENT" },
        params: { id: mockPostId },
        body: { content: "test" },
      });
      mockCreateComment.mockRejectedValue(new PostNotFoundError(mockPostId));

      await createComment(mockRequest as any, mockResponse as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(PostNotFoundError));
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should call next with validation error for invalid post ID", async () => {
      mockRequest = createReq({
        user: { id: mockUserId, role: "STUDENT" },
        params: { id: "invalid-uuid" },
        body: { content: "test" },
      });

      await createComment(mockRequest as any, mockResponse as any, mockNext);

      expect(mockCreateComment).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it("should handle empty content", async () => {
      mockRequest = createReq({
        user: { id: mockUserId, role: "STUDENT" },
        params: { id: mockPostId },
        body: { content: "" },
      });

      await createComment(mockRequest as any, mockResponse as any, mockNext);

      expect(mockCreateComment).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe("getParentComments", () => {
    it("should get parent comments successfully", async () => {
      const mockResult = {
        data: [{ id: 1, content: "Parent comment" }],
        pagination: { hasMore: false, nextCursor: null, totalComments: 1 },
      };
      mockRequest = createReq({
        user: { id: mockUserId, role: "STUDENT" },
        params: { id: mockPostId },
        query: {},
      });
      mockGetParentComments.mockResolvedValue(mockResult);

      await getParentComments(mockRequest as any, mockResponse as any, mockNext);

      expect(mockGetParentComments).toHaveBeenCalledWith(mockPostId, 10, undefined);
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it("should pass limit and cursor to service", async () => {
      const mockResult = {
        data: [],
        pagination: { hasMore: false, nextCursor: null, totalComments: 0 },
      };
      mockRequest = createReq({
        user: { id: mockUserId, role: "STUDENT" },
        params: { id: mockPostId },
        query: { limit: "5", cursor: "3" },
      });
      mockGetParentComments.mockResolvedValue(mockResult);

      await getParentComments(mockRequest as any, mockResponse as any, mockNext);

      expect(mockGetParentComments).toHaveBeenCalledWith(mockPostId, 5, 3);
    });

    it("should call next with validation error for invalid post ID", async () => {
      mockRequest = createReq({
        user: { id: mockUserId, role: "STUDENT" },
        params: { id: "invalid-uuid" },
        query: {},
      });

      await getParentComments(mockRequest as any, mockResponse as any, mockNext);

      expect(mockGetParentComments).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it("should handle service errors", async () => {
      const dbError = new Error("DB error");
      mockRequest = createReq({
        user: { id: mockUserId, role: "STUDENT" },
        params: { id: mockPostId },
        query: {},
      });
      mockGetParentComments.mockRejectedValue(dbError);

      await getParentComments(mockRequest as any, mockResponse as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(dbError);
    });
  });

  describe("getReplies", () => {
    it("should get replies successfully", async () => {
      const mockResult = {
        data: [{ id: 2, content: "A reply" }],
        pagination: { hasMore: false, nextCursor: null },
      };
      mockRequest = createReq({
        user: { id: mockUserId, role: "STUDENT" },
        params: { id: "5" },
        query: {},
      });
      mockGetReplies.mockResolvedValue(mockResult);

      await getReplies(mockRequest as any, mockResponse as any, mockNext);

      expect(mockGetReplies).toHaveBeenCalledWith(5, 10, undefined);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it("should call next with validation error for invalid comment ID", async () => {
      mockRequest = createReq({
        user: { id: mockUserId, role: "STUDENT" },
        params: { id: "not-a-number" },
        query: {},
      });

      await getReplies(mockRequest as any, mockResponse as any, mockNext);

      expect(mockGetReplies).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe("deleteComment", () => {
    it("should delete a comment successfully", async () => {
      mockRequest = createReq({
        user: { id: mockUserId, role: "STUDENT" },
        params: { id: "123" },
      });
      mockDeleteComment.mockResolvedValue(undefined);

      await deleteComment(mockRequest as any, mockResponse as any, mockNext);

      expect(mockDeleteComment).toHaveBeenCalledWith(123, { id: mockUserId, role: "STUDENT" });
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Comment deleted successfully",
      });
    });

    it("should call next with CommentNotFoundError when not found", async () => {
      mockRequest = createReq({
        user: { id: mockUserId, role: "STUDENT" },
        params: { id: "999" },
      });
      mockDeleteComment.mockRejectedValue(new CommentNotFoundError(999));

      await deleteComment(mockRequest as any, mockResponse as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(CommentNotFoundError));
    });

    it("should call next with validation error for invalid comment ID", async () => {
      mockRequest = createReq({
        user: { id: mockUserId, role: "STUDENT" },
        params: { id: "invalid" },
      });

      await deleteComment(mockRequest as any, mockResponse as any, mockNext);

      expect(mockDeleteComment).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
