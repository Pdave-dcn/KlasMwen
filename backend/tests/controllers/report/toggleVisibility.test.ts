import { ZodError } from "zod";

import { toggleVisibility } from "../../../src/controllers/report/report.moderator.controller.js";
import prisma from "../../../src/core/config/db.js";
import { AuthorizationError } from "../../../src/core/error/custom/auth.error";
import { commentService } from "../../../src/features/comment/service/index.js";
import { postService } from "../../../src/features/posts/service/PostService";

import { createAuthenticatedUser } from "./shared/helpers";
import { createMockRequest, createMockResponse } from "./shared/mocks";

import type { Role } from "@prisma/client";
import type { Request, Response } from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
  controllerLogger: {
    child: vi.fn(() => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    })),
  },
}));

vi.mock("../../../src/core/error/index", () => ({
  handleError: vi.fn(),
}));

vi.mock("../../../src/core/config/db.js", () => ({
  default: {
    post: {
      update: vi.fn(),
    },
    comment: {
      update: vi.fn(),
    },
  },
}));

vi.mock("../../../src/features/posts/service/PostService", () => ({
  postService: {
    validate: {
      verifyPostExists: vi.fn(),
    },
  },
}));
vi.mock("../../../src/features/comment/service/index", () => ({
  commentService: {
    validate: {
      commentExists: vi.fn(),
    },
  },
}));

describe("toggleVisibility controller", () => {
  let mockRequest: Request & { user?: { id: string; role: Role } };
  let mockResponse: Response;
  let mockNext: any;

  const mockUserId = "910da3f7-f419-4929-b775-6e26ba17f248";
  const mockPostId = "6b2efb09-e634-41d9-b2eb-d4972fabb729";

  const mockCommentId = 123;

  const mockAdminUser = createAuthenticatedUser({
    id: mockUserId,
    role: "ADMIN",
  });

  beforeEach(() => {
    mockRequest = createMockRequest();
    mockNext = vi.fn();
    mockResponse = createMockResponse();
    vi.clearAllMocks();

    postService.validate.verifyPostExists.mockResolvedValue({
      type: "NOTE" as const,
      id: mockPostId,
      createdAt: new Date(),
      authorId: mockUserId,
      fileUrl: null,
    });
    commentService.validate.commentExists.mockResolvedValue({
      id: mockCommentId,
      postId: mockPostId,
      parentId: null,
      authorId: mockUserId,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // --- Success Cases ---
  describe("Success Cases", () => {
    it("should successfully hide a 'post', check existence, and return 200", async () => {
      // Setup
      mockRequest.user = mockAdminUser;
      const mockPostData = {
        resourceType: "post",
        resourceId: mockPostId,
        hidden: true,
      };
      mockRequest.body = mockPostData;

      vi.mocked(prisma.post.update).mockResolvedValue({
        id: mockPostId,
      } as any);

      await toggleVisibility(mockRequest, mockResponse, mockNext);

      expect(postService.validate.verifyPostExists).toHaveBeenCalledWith(
        mockPostData.resourceId,
      );
      expect(commentService.validate.commentExists).not.toHaveBeenCalled();

      // DB update called
      expect(prisma.post.update).toHaveBeenCalledWith({
        where: { id: mockPostData.resourceId },
        data: { hidden: mockPostData.hidden },
      });
      expect(prisma.comment.update).not.toHaveBeenCalled();

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Successfully hid post",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should successfully unhide a 'comment', check existence, and return 200", async () => {
      // Setup
      mockRequest.user = mockAdminUser;
      const mockCommentData = {
        resourceType: "comment",
        resourceId: 456,
        hidden: false,
      };
      mockRequest.body = mockCommentData;

      vi.mocked(prisma.comment.update).mockResolvedValue({ id: 456 } as any);

      await toggleVisibility(mockRequest, mockResponse, mockNext);

      expect(postService.validate.verifyPostExists).not.toHaveBeenCalled();
      expect(commentService.validate.commentExists).toHaveBeenCalledWith(
        mockCommentData.resourceId,
      );

      // DB update called
      expect(prisma.comment.update).toHaveBeenCalledWith({
        where: { id: mockCommentData.resourceId },
        data: { hidden: mockCommentData.hidden },
      });
      expect(prisma.post.update).not.toHaveBeenCalled();

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Successfully unhid comment",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  // --- Error Cases ---
  describe("Error Cases", () => {
    it("should call handleError when request body validation fails (ZodError)", async () => {
      // Setup
      mockRequest.user = mockAdminUser;
      mockRequest.body = { resourceType: "invalid", resourceId: 1 };

      await toggleVisibility(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
      expect(postService.validate.verifyPostExists).not.toHaveBeenCalled();
      expect(prisma.post.update).not.toHaveBeenCalled();
    });

    it("should call handleError and stop execution if 'post' does not exist", async () => {
      // Setup
      mockRequest.user = mockAdminUser;
      const mockPostData = {
        resourceType: "post",
        resourceId: "post-404",
        hidden: true,
      };
      mockRequest.body = mockPostData;

      const notFoundError = new Error("Post not found");
      // Mock existence check to reject
      postService.validate.verifyPostExists.mockRejectedValue(notFoundError);

      // Execute
      await toggleVisibility(mockRequest, mockResponse, mockNext);

      // Assertions
      expect(postService.validate.verifyPostExists).toHaveBeenCalledWith(
        mockPostData.resourceId,
      );
      expect(prisma.post.update).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(notFoundError);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should call handleError and stop execution if 'comment' does not exist", async () => {
      // Setup
      mockRequest.user = mockAdminUser;
      const mockCommentData = {
        resourceType: "comment",
        resourceId: 404,
        hidden: false,
      };
      mockRequest.body = mockCommentData;

      const notFoundError = new Error("Comment not found");
      // Mock existence check to reject
      commentService.validate.commentExists.mockRejectedValue(notFoundError);

      // Execute
      await toggleVisibility(mockRequest, mockResponse, mockNext);

      // Assertions
      expect(commentService.validate.commentExists).toHaveBeenCalledWith(
        mockCommentData.resourceId,
      );
      expect(prisma.comment.update).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(notFoundError);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should call handleError for unexpected database errors on 'post' update (after existence check)", async () => {
      // Setup
      mockRequest.user = mockAdminUser;
      const mockPostData = {
        resourceType: "post",
        resourceId: "post-db-fail",
        hidden: true,
      };
      mockRequest.body = mockPostData;

      const dbError = new Error("Record to update not found");
      // Mock prisma.post.update to reject
      vi.mocked(prisma.post.update).mockRejectedValue(dbError);

      // Execute
      await toggleVisibility(mockRequest, mockResponse, mockNext);

      // Assertions
      expect(postService.validate.verifyPostExists).toHaveBeenCalled(); // Existence check passed
      expect(prisma.post.update).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(dbError);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should call handleError for unexpected database errors on 'comment' update (after existence check)", async () => {
      // Setup
      mockRequest.user = mockAdminUser;
      const mockCommentData = {
        resourceType: "comment",
        resourceId: 404,
        hidden: false,
      };
      mockRequest.body = mockCommentData;

      const dbError = new Error("Prisma Client Error: Invalid ID format");
      // Mock prisma.comment.update to reject
      vi.mocked(prisma.comment.update).mockRejectedValue(dbError);

      // Execute
      await toggleVisibility(mockRequest, mockResponse, mockNext);

      // Assertions
      expect(commentService.validate.commentExists).toHaveBeenCalled(); // Existence check passed
      expect(prisma.comment.update).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(dbError);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });
});
