import { ZodError } from "zod";

import { toggleVisibility } from "../../../controllers/report.controller";
import prisma from "../../../core/config/db.js";
import { handleError } from "../../../core/error";
import { AuthorizationError } from "../../../core/error/custom/auth.error";
import CommentService from "../../../features/comments/service/CommentService";
import PostService from "../../../features/posts/service/PostService";

import { createAuthenticatedUser } from "./shared/helpers";
import { createMockRequest, createMockResponse } from "./shared/mocks";

import type { Role } from "@prisma/client";
import type { Request, Response } from "express";

vi.mock("../../../core/config/logger.js", () => ({
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

vi.mock("../../../core/error/index", () => ({
  handleError: vi.fn(),
}));

vi.mock("../../../core/config/db.js", () => ({
  default: {
    post: {
      update: vi.fn(),
    },
    comment: {
      update: vi.fn(),
    },
  },
}));

vi.mock("../../../features/posts/service/PostService");
vi.mock("../../../features/comments/service/CommentService");

const mockPostService = vi.mocked(PostService);
const mockCommentService = vi.mocked(CommentService);

describe("toggleVisibility controller", () => {
  let mockRequest: Request;
  let mockResponse: Response;

  const mockUserId = "910da3f7-f419-4929-b775-6e26ba17f248";
  const mockPostId = "6b2efb09-e634-41d9-b2eb-d4972fabb729";

  const mockCommentId = 123;

  const mockAdminUser = createAuthenticatedUser({
    id: mockUserId,
    role: "ADMIN",
  });

  beforeEach(() => {
    mockRequest = createMockRequest();
    mockResponse = createMockResponse();
    vi.clearAllMocks();

    mockPostService.verifyPostExists.mockResolvedValue({
      type: "NOTE" as const,
      id: mockPostId,
      createdAt: new Date(),
      authorId: mockUserId,
      fileUrl: null,
    });
    mockCommentService.commentExists.mockResolvedValue({
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

      await toggleVisibility(mockRequest, mockResponse);

      expect(mockPostService.verifyPostExists).toHaveBeenCalledWith(
        mockPostData.resourceId
      );
      expect(mockCommentService.commentExists).not.toHaveBeenCalled();

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
      expect(handleError).not.toHaveBeenCalled();
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

      await toggleVisibility(mockRequest, mockResponse);

      expect(mockPostService.verifyPostExists).not.toHaveBeenCalled();
      expect(mockCommentService.commentExists).toHaveBeenCalledWith(
        mockCommentData.resourceId
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
      expect(handleError).not.toHaveBeenCalled();
    });
  });

  // --- Error Cases ---
  describe("Error Cases", () => {
    it("should call handleError when checkAdminAuth fails (unauthorized user)", async () => {
      // Setup
      mockRequest.user = createAuthenticatedUser({ role: "STUDENT" as Role });

      await toggleVisibility(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalledWith(
        expect.any(AuthorizationError),
        mockResponse
      );
      expect(mockPostService.verifyPostExists).not.toHaveBeenCalled();
      expect(prisma.post.update).not.toHaveBeenCalled();
    });

    it("should call handleError when request body validation fails (ZodError)", async () => {
      // Setup
      mockRequest.user = mockAdminUser;
      mockRequest.body = { resourceType: "invalid", resourceId: 1 };

      await toggleVisibility(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalledWith(
        expect.any(ZodError),
        mockResponse
      );
      expect(mockPostService.verifyPostExists).not.toHaveBeenCalled();
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
      mockPostService.verifyPostExists.mockRejectedValue(notFoundError);

      // Execute
      await toggleVisibility(mockRequest, mockResponse);

      // Assertions
      expect(mockPostService.verifyPostExists).toHaveBeenCalledWith(
        mockPostData.resourceId
      );
      expect(prisma.post.update).not.toHaveBeenCalled();
      expect(handleError).toHaveBeenCalledWith(notFoundError, mockResponse);
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
      mockCommentService.commentExists.mockRejectedValue(notFoundError);

      // Execute
      await toggleVisibility(mockRequest, mockResponse);

      // Assertions
      expect(mockCommentService.commentExists).toHaveBeenCalledWith(
        mockCommentData.resourceId
      );
      expect(prisma.comment.update).not.toHaveBeenCalled();
      expect(handleError).toHaveBeenCalledWith(notFoundError, mockResponse);
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
      await toggleVisibility(mockRequest, mockResponse);

      // Assertions
      expect(mockPostService.verifyPostExists).toHaveBeenCalled(); // Existence check passed
      expect(prisma.post.update).toHaveBeenCalled();
      expect(handleError).toHaveBeenCalledWith(dbError, mockResponse);
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
      await toggleVisibility(mockRequest, mockResponse);

      // Assertions
      expect(mockCommentService.commentExists).toHaveBeenCalled(); // Existence check passed
      expect(prisma.comment.update).toHaveBeenCalled();
      expect(handleError).toHaveBeenCalledWith(dbError, mockResponse);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });
});
