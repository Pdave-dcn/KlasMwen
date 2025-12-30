import { ZodError } from "zod";

import { createReport } from "../../../src/controllers/report/report.user.controller.js";
import prisma from "../../../src/core/config/db.js";
import { CommentNotFoundError } from "../../../src/core/error/custom/comment.error";
import { PostNotFoundError } from "../../../src/core/error/custom/post.error";
import { assertPermission } from "../../../src/core/security/rbac";
import CommentService from "../../../src/features/comments/service/CommentService";
import PostService from "../../../src/features/posts/service/PostService";
import { autoHideContent } from "../../../src/features/report/helpers/autoHideContent";

import { createAuthenticatedUser } from "./shared/helpers";
import { createMockRequest, createMockResponse } from "./shared/mocks";

import type { Request, Response } from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock dependencies
vi.mock("../../../src/core/config/logger.js", () => ({
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
  logger: {
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
  },
}));

vi.mock("../../../src/core/error/index", () => ({
  handleError: vi.fn(),
}));

vi.mock("../../../src/core/security/rbac", () => ({
  assertPermission: vi.fn(),
}));

vi.mock("../../../src/core/config/db.js", () => ({
  default: {
    report: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    reportReason: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("../../../src/features/posts/service/PostService", () => ({
  default: {
    verifyPostExists: vi.fn(),
  },
}));

vi.mock("../../../src/features/comments/service/CommentService", () => ({
  default: {
    commentExists: vi.fn(),
  },
}));

vi.mock("../../../src/features/report/helpers/autoHideContent", () => ({
  autoHideContent: vi.fn(),
}));

describe("createReport controller", () => {
  let mockRequest: Request;
  let mockResponse: Response;
  let mockNext: any;

  const mockUserId = "910da3f7-f419-4929-b775-6e26ba17f248";
  const mockPostId = "6b2efb09-e634-41d9-b2eb-d4972fabb729";
  const mockCommentId = 123;
  const mockReasonId = 1;

  const createMockReport = (overrides = {}) => ({
    id: 1,
    reporterId: mockUserId,
    reasonId: mockReasonId,
    status: "PENDING" as const,
    moderatorNotes: null,
    createdAt: new Date("2024-01-01T00:00:00Z"),
    reporter: {
      id: mockUserId,
      username: "testUser",
      email: "test@example.com",
      role: "STUDENT" as const,
    },
    reason: {
      id: mockReasonId,
      label: "Spam",
    },
    post: null,
    comment: null,
    ...overrides,
  });

  beforeEach(() => {
    mockRequest = createMockRequest();
    mockNext = vi.fn();
    mockResponse = createMockResponse();
    vi.clearAllMocks();

    vi.mocked(assertPermission).mockReturnValue();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("Success Cases", () => {
    it("should create a post report successfully", async () => {
      mockRequest.user = createAuthenticatedUser({ id: mockUserId });
      mockRequest.body = {
        postId: mockPostId,
        reasonId: mockReasonId,
      };

      vi.mocked(PostService.verifyPostExists).mockResolvedValue({
        type: "NOTE" as const,
        id: mockPostId,
        createdAt: new Date(),
        authorId: mockUserId,
        fileUrl: null,
      });

      const mockReportData = createMockReport({
        postId: mockPostId,
        commentId: null,
        post: {
          id: mockPostId,
          title: "Test Post",
        },
      });

      vi.mocked(prisma.report.create).mockResolvedValue({
        ...mockReportData,
        postId: mockPostId,
        commentId: null,
      });

      await createReport(mockRequest, mockResponse, mockNext);

      expect(PostService.verifyPostExists).toHaveBeenCalledWith(mockPostId);
      expect(autoHideContent).toHaveBeenCalledWith({
        resourceType: "post",
        resourceId: mockPostId,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Report successfully created",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should create a comment report successfully", async () => {
      mockRequest.user = createAuthenticatedUser({ id: mockUserId });
      mockRequest.body = {
        commentId: mockCommentId,
        reasonId: mockReasonId,
      };

      vi.mocked(CommentService.commentExists).mockResolvedValue({
        id: mockCommentId,
        postId: mockPostId,
        parentId: null,
        authorId: mockUserId,
      });

      const mockReportData = createMockReport({
        postId: null,
        commentId: mockCommentId,
        comment: {
          id: mockCommentId,
          content: "Test Comment",
        },
      });

      vi.mocked(prisma.report.create).mockResolvedValue({
        ...mockReportData,
        postId: null,
        commentId: mockCommentId,
      });

      await createReport(mockRequest, mockResponse, mockNext);

      expect(CommentService.commentExists).toHaveBeenCalledWith(mockCommentId);
      expect(autoHideContent).toHaveBeenCalledWith({
        resourceType: "comment",
        resourceId: mockCommentId,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Report successfully created",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle autoHideContent being called asynchronously", async () => {
      mockRequest.user = createAuthenticatedUser({ id: mockUserId });
      mockRequest.body = {
        postId: mockPostId,
        reasonId: mockReasonId,
      };

      vi.mocked(PostService.verifyPostExists).mockResolvedValue({
        id: mockPostId,
        authorId: mockUserId,
        createdAt: new Date(),
        type: "NOTE",
        fileUrl: null,
      });

      const mockReportData = createMockReport({
        postId: mockPostId,
        commentId: null,
        post: {
          id: mockPostId,
          title: "Test Post",
        },
      });

      vi.mocked(prisma.report.create).mockResolvedValue({
        ...mockReportData,
        postId: mockPostId,
        commentId: null,
      });

      // Mock autoHideContent to simulate async behavior
      let autoHideResolved = false;
      vi.mocked(autoHideContent).mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        autoHideResolved = true;
      });

      await createReport(mockRequest, mockResponse, mockNext);

      // Response should be sent before autoHideContent completes
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(autoHideContent).toHaveBeenCalled();

      // Wait for autoHideContent to complete
      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(autoHideResolved).toBe(true);
    });
  });

  describe("Error Cases", () => {
    it("should call handleError when post does not exist", async () => {
      mockRequest.user = createAuthenticatedUser({ id: mockUserId });
      mockRequest.body = {
        postId: mockPostId,
        reasonId: mockReasonId,
      };

      vi.mocked(PostService.verifyPostExists).mockRejectedValue(
        new PostNotFoundError(mockPostId)
      );

      await createReport(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(PostNotFoundError));
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should call handleError when comment does not exist", async () => {
      mockRequest.user = createAuthenticatedUser({ id: mockUserId });
      mockRequest.body = {
        commentId: mockCommentId,
        reasonId: mockReasonId,
      };

      vi.mocked(CommentService.commentExists).mockRejectedValue(
        new CommentNotFoundError(mockCommentId)
      );

      await createReport(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(CommentNotFoundError));
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should call handleError for unexpected database errors", async () => {
      mockRequest.user = createAuthenticatedUser({ id: mockUserId });
      mockRequest.body = {
        postId: mockPostId,
        reasonId: mockReasonId,
      };

      const dbError = new Error("Database connection failed");
      vi.mocked(PostService.verifyPostExists).mockRejectedValue(dbError);

      await createReport(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(dbError);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe("Input Validation", () => {
    it("should handle invalid request body (missing reasonId)", async () => {
      mockRequest.user = createAuthenticatedUser({ id: mockUserId });
      mockRequest.body = {
        postId: mockPostId,
        // missing reasonId
      };

      await createReport(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(PostService.verifyPostExists).not.toHaveBeenCalled();
    });

    it("should handle invalid request body (missing both postId and commentId)", async () => {
      mockRequest.user = createAuthenticatedUser({ id: mockUserId });
      mockRequest.body = {
        reasonId: mockReasonId,
        // missing both postId and commentId
      };

      await createReport(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(PostService.verifyPostExists).not.toHaveBeenCalled();
      expect(CommentService.commentExists).not.toHaveBeenCalled();
    });

    it("should handle invalid request body (both postId and commentId provided)", async () => {
      mockRequest.user = createAuthenticatedUser({ id: mockUserId });
      mockRequest.body = {
        postId: mockPostId,
        commentId: mockCommentId,
        reasonId: mockReasonId,
      };

      await createReport(mockRequest, mockResponse, mockNext);

      // Should fail validation if schema doesn't allow both
      expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
    });

    it("should handle invalid postId format", async () => {
      mockRequest.user = createAuthenticatedUser({ id: mockUserId });
      mockRequest.body = {
        postId: "invalid-uuid",
        reasonId: mockReasonId,
      };

      await createReport(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
      expect(PostService.verifyPostExists).not.toHaveBeenCalled();
    });

    it("should handle invalid commentId type", async () => {
      mockRequest.user = createAuthenticatedUser({ id: mockUserId });
      mockRequest.body = {
        commentId: "not-a-number",
        reasonId: mockReasonId,
      };

      await createReport(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(CommentService.commentExists).not.toHaveBeenCalled();
    });

    it("should handle invalid reasonId type", async () => {
      mockRequest.user = createAuthenticatedUser({ id: mockUserId });
      mockRequest.body = {
        postId: mockPostId,
        reasonId: "not-a-number",
      };

      await createReport(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(PostService.verifyPostExists).not.toHaveBeenCalled();
    });

    it("should handle negative reasonId", async () => {
      mockRequest.user = createAuthenticatedUser({ id: mockUserId });
      mockRequest.body = {
        postId: mockPostId,
        reasonId: -1,
      };

      await createReport(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should handle zero reasonId", async () => {
      mockRequest.user = createAuthenticatedUser({ id: mockUserId });
      mockRequest.body = {
        postId: mockPostId,
        reasonId: 0,
      };

      await createReport(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should handle negative commentId", async () => {
      mockRequest.user = createAuthenticatedUser({ id: mockUserId });
      mockRequest.body = {
        commentId: -5,
        reasonId: mockReasonId,
      };

      await createReport(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("Edge Cases", () => {
    it("should handle extra fields in request body", async () => {
      mockRequest.user = createAuthenticatedUser({ id: mockUserId });
      mockRequest.body = {
        postId: mockPostId,
        reasonId: mockReasonId,
        extraField: "should be ignored",
        anotherExtra: 123,
      };

      vi.mocked(PostService.verifyPostExists).mockResolvedValue({
        id: mockPostId,
        authorId: mockUserId,
        createdAt: new Date(),
        type: "NOTE",
        fileUrl: null,
      });

      const mockReportData = createMockReport({
        postId: mockPostId,
        commentId: null,
        post: {
          id: mockPostId,
          title: "Test Post",
        },
      });

      vi.mocked(prisma.report.create).mockResolvedValue({
        ...mockReportData,
        postId: mockPostId,
        commentId: null,
      });

      await createReport(mockRequest, mockResponse, mockNext);

      // Should succeed if Zod schema strips extra fields
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });

    it("should handle very large reasonId", async () => {
      mockRequest.user = createAuthenticatedUser({ id: mockUserId });
      mockRequest.body = {
        postId: mockPostId,
        reasonId: Number.MAX_SAFE_INTEGER,
      };

      vi.mocked(PostService.verifyPostExists).mockResolvedValue({
        id: mockPostId,
        authorId: mockUserId,
        createdAt: new Date(),
        type: "NOTE",
        fileUrl: null,
      });

      const mockReportData = createMockReport({
        postId: mockPostId,
        reasonId: Number.MAX_SAFE_INTEGER,
        post: {
          id: mockPostId,
          title: "Test Post",
        },
      });

      vi.mocked(prisma.report.create).mockResolvedValue({
        ...mockReportData,
        postId: mockPostId,
        commentId: null,
      });

      await createReport(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });
  });

  describe("Authentication Edge Cases", () => {
    it("should handle malformed user object with partial data", async () => {
      mockRequest.user = {
        id: mockUserId,
        // missing other expected fields
      } as any;
      mockRequest.body = {
        postId: mockPostId,
        reasonId: mockReasonId,
      };

      vi.mocked(PostService.verifyPostExists).mockResolvedValue({
        id: mockPostId,
        authorId: mockUserId,
        createdAt: new Date(),
        type: "NOTE",
        fileUrl: null,
      });

      const mockReportData = createMockReport({
        postId: mockPostId,
        post: {
          id: mockPostId,
          title: "Test Post",
        },
      });

      vi.mocked(prisma.report.create).mockResolvedValue({
        ...mockReportData,
        postId: mockPostId,
        commentId: null,
      });

      await createReport(mockRequest, mockResponse, mockNext);

      // Should succeed as long as user.id exists
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });
  });

  describe("Response Format Validation", () => {
    it("should return correct response structure for successful post report creation", async () => {
      mockRequest.user = createAuthenticatedUser({ id: mockUserId });
      mockRequest.body = {
        postId: mockPostId,
        reasonId: mockReasonId,
      };

      vi.mocked(PostService.verifyPostExists).mockResolvedValue({
        id: mockPostId,
        authorId: mockUserId,
        createdAt: new Date(),
        type: "NOTE",
        fileUrl: null,
      });

      const mockReportData = createMockReport({
        postId: mockPostId,
        post: {
          id: mockPostId,
          title: "Test Post Title",
        },
      });

      vi.mocked(prisma.report.create).mockResolvedValue({
        ...mockReportData,
        postId: mockPostId,
        commentId: null,
      });

      await createReport(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Report successfully created",
      });
    });

    it("should return correct response structure for successful comment report creation", async () => {
      mockRequest.user = createAuthenticatedUser({ id: mockUserId });
      mockRequest.body = {
        commentId: mockCommentId,
        reasonId: mockReasonId,
      };

      vi.mocked(CommentService.commentExists).mockResolvedValue({
        id: mockCommentId,
        postId: mockPostId,
        parentId: null,
        authorId: mockUserId,
      });

      const mockReportData = createMockReport({
        commentId: mockCommentId,
        comment: {
          id: mockCommentId,
          content: "Test Comment Content",
        },
      });

      vi.mocked(prisma.report.create).mockResolvedValue({
        ...mockReportData,
        postId: mockPostId,
        commentId: null,
      });

      await createReport(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Report successfully created",
      });
    });
  });

  describe("Service Integration", () => {
    it("should call PostService.verifyPostExists with correct postId", async () => {
      mockRequest.user = createAuthenticatedUser({ id: mockUserId });
      mockRequest.body = {
        postId: mockPostId,
        reasonId: mockReasonId,
      };

      vi.mocked(PostService.verifyPostExists).mockResolvedValue({
        id: mockPostId,
        authorId: mockUserId,
        createdAt: new Date(),
        type: "NOTE",
        fileUrl: null,
      });

      const mockReportData = createMockReport({
        postId: mockPostId,
        post: {
          id: mockPostId,
          title: "Test Post",
        },
      });

      vi.mocked(prisma.report.create).mockResolvedValue({
        ...mockReportData,
        postId: mockPostId,
        commentId: null,
      });

      await createReport(mockRequest, mockResponse, mockNext);

      expect(PostService.verifyPostExists).toHaveBeenCalledWith(mockPostId);
      expect(PostService.verifyPostExists).toHaveBeenCalledTimes(1);
    });

    it("should call CommentService.commentExists with correct commentId", async () => {
      mockRequest.user = createAuthenticatedUser({ id: mockUserId });
      mockRequest.body = {
        commentId: mockCommentId,
        reasonId: mockReasonId,
      };

      vi.mocked(CommentService.commentExists).mockResolvedValue({
        id: mockCommentId,
        postId: mockPostId,
        parentId: null,
        authorId: mockUserId,
      });

      const mockReportData = createMockReport({
        commentId: mockCommentId,
        comment: {
          id: mockCommentId,
          content: "Test Comment",
        },
      });

      vi.mocked(prisma.report.create).mockResolvedValue({
        ...mockReportData,
        postId: null,
        commentId: mockCommentId,
      });

      await createReport(mockRequest, mockResponse, mockNext);

      expect(CommentService.commentExists).toHaveBeenCalledWith(mockCommentId);
      expect(CommentService.commentExists).toHaveBeenCalledTimes(1);
    });

    it("should call autoHideContent with correct parameters for post", async () => {
      mockRequest.user = createAuthenticatedUser({ id: mockUserId });
      mockRequest.body = {
        postId: mockPostId,
        reasonId: mockReasonId,
      };

      vi.mocked(PostService.verifyPostExists).mockResolvedValue({
        id: mockPostId,
        authorId: mockUserId,
        createdAt: new Date(),
        type: "NOTE",
        fileUrl: null,
      });

      const mockReportData = createMockReport({
        postId: mockPostId,
        post: {
          id: mockPostId,
          title: "Test Post",
        },
      });

      vi.mocked(prisma.report.create).mockResolvedValue({
        ...mockReportData,
        postId: mockPostId,
        commentId: null,
      });

      await createReport(mockRequest, mockResponse, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(autoHideContent).toHaveBeenCalledWith({
        resourceType: "post",
        resourceId: mockPostId,
      });
      expect(autoHideContent).toHaveBeenCalledTimes(1);
    });

    it("should call autoHideContent with correct parameters for comment", async () => {
      mockRequest.user = createAuthenticatedUser({ id: mockUserId });
      mockRequest.body = {
        commentId: mockCommentId,
        reasonId: mockReasonId,
      };

      vi.mocked(CommentService.commentExists).mockResolvedValue({
        id: mockCommentId,
        postId: mockPostId,
        parentId: null,
        authorId: mockUserId,
      });

      const mockReportData = createMockReport({
        commentId: mockCommentId,
        comment: {
          id: mockCommentId,
          content: "Test Comment",
        },
      });

      vi.mocked(prisma.report.create).mockResolvedValue({
        ...mockReportData,
        postId: null,
        commentId: mockCommentId,
      });

      await createReport(mockRequest, mockResponse, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(autoHideContent).toHaveBeenCalledWith({
        resourceType: "comment",
        resourceId: mockCommentId,
      });
      expect(autoHideContent).toHaveBeenCalledTimes(1);
    });
  });
});
