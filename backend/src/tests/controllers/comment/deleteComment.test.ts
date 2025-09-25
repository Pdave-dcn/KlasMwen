import { Role } from "@prisma/client";
import { Request, Response } from "express";

import { deleteComment } from "../../../controllers/comment.controller";
import prisma from "../../../core/config/db";
import { handleError } from "../../../core/error";
import {
  AuthenticationError,
  AuthorizationError,
} from "../../../core/error/custom/auth.error";

import { createAuthenticatedUser } from "./shared/helpers";
import { createMockRequest, createMockResponse } from "./shared/mocks";

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

vi.mock("../../../core/error/index", () => ({
  handleError: vi.fn(),
}));

vi.mock("../../../core/config/db.js", () => ({
  default: {
    post: {
      findUnique: vi.fn(),
    },
    comment: {
      findUnique: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe("deleteComment controller", () => {
  let mockRequest: Request;
  let mockResponse: Response;

  const mockPostId = "6b2efb09-e634-41d9-b2eb-d4972fabb729";
  const mockUserId1 = "910da3f7-f419-4929-b775-6e26ba17f248";
  const mockUserId2 = "60676309-9958-4a6a-b4bc-463199dab4ee";

  beforeEach(() => {
    mockRequest = createMockRequest();
    mockResponse = createMockResponse();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("Success Cases", () => {
    it("should delete the comment successfully if the user is the author", async () => {
      mockRequest.user = createAuthenticatedUser({ id: mockUserId1 });
      mockRequest.params = { id: "5" };

      vi.mocked(prisma.comment.findUnique).mockResolvedValue({
        id: 5,
        authorId: mockUserId1,
        postId: mockPostId,
        content: "Test comment",
        parentId: null,
        createdAt: new Date(),
      });
      vi.mocked(prisma.comment.delete).mockResolvedValue({} as any);

      await deleteComment(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Comment deleted successfully",
      });
      expect(prisma.comment.delete).toHaveBeenCalledWith({
        where: { id: 5 },
      });
    });

    it("should delete the comment successfully if the user is an ADMIN", async () => {
      mockRequest.user = createAuthenticatedUser({
        id: mockUserId2,
        role: "ADMIN" as Role,
      });
      mockRequest.params = { id: "6" };

      vi.mocked(prisma.comment.findUnique).mockResolvedValue({
        id: 6,
        authorId: mockUserId1, // User is not the author, but has admin role
        postId: mockPostId,
        content: "Admin test comment",
        parentId: null,
        createdAt: new Date(),
      });
      vi.mocked(prisma.comment.delete).mockResolvedValue({} as any);

      await deleteComment(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Comment deleted successfully",
      });
      expect(prisma.comment.delete).toHaveBeenCalledWith({
        where: { id: 6 },
      });
    });
  });

  describe("Error Cases", () => {
    it("should call handleError with AuthenticationError when user is not authenticated", async () => {
      mockRequest.user = undefined;
      mockRequest.params = { id: "5" };

      await deleteComment(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalledWith(
        expect.any(AuthenticationError),
        mockResponse
      );
      expect(prisma.comment.delete).not.toHaveBeenCalled();
    });

    it("should return 404 if the comment does not exist", async () => {
      mockRequest.user = createAuthenticatedUser({ id: mockUserId1 });
      mockRequest.params = { id: "999" };

      vi.mocked(prisma.comment.findUnique).mockResolvedValue(null);

      await deleteComment(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Comment not found",
      });
      expect(prisma.comment.delete).not.toHaveBeenCalled();
    });

    it("should call handleError with AuthorizationError when user is not the author or an admin", async () => {
      mockRequest.user = createAuthenticatedUser({ id: mockUserId1 });
      mockRequest.params = { id: "5" };

      vi.mocked(prisma.comment.findUnique).mockResolvedValue({
        id: 5,
        authorId: mockUserId2, // Another user is the author
        postId: mockPostId,
        content: "Test comment",
        parentId: null,
        createdAt: new Date(),
      });

      await deleteComment(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalledWith(
        expect.any(AuthorizationError),
        mockResponse
      );
      expect(prisma.comment.delete).not.toHaveBeenCalled();
    });

    it("should call handleError for unexpected errors", async () => {
      mockRequest.user = createAuthenticatedUser({ id: mockUserId1 });
      mockRequest.params = { id: "5" };

      const error = new Error("Database deletion failed");
      vi.mocked(prisma.comment.findUnique).mockRejectedValue(error);

      await deleteComment(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalledWith(error, mockResponse);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });
});
