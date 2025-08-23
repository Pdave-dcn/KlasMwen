import { Post, Comment, Role } from "@prisma/client";
import { Request, Response } from "express";
import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  createComment,
  getReplies,
  deleteComment,
} from "../../controllers/comment.controller.js";
import prisma from "../../core/config/db.js";
import { createLogger } from "../../core/config/logger.js";
import {
  AuthenticationError,
  AuthorizationError,
} from "../../core/error/custom/auth.error.js";
import { handleError } from "../../core/error/index";
import { CreateCommentSchema } from "../../zodSchemas/comment.zod.js";
import { PostIdParamSchema } from "../../zodSchemas/post.zod.js";

vi.mock("../../core/config/db.js", () => ({
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

vi.mock("../../zodSchemas/post.zod.js", () => ({
  PostIdParamSchema: {
    parse: vi.fn((params) => ({ id: params.id })),
  },
}));

vi.mock("../../zodSchemas/comment.zod.js", () => ({
  CreateCommentSchema: {
    parse: vi.fn((body) => ({
      content: body.content,
      parentId: body.parentId,
    })),
  },
}));

vi.mock("../../core/error/index", () => ({
  handleError: vi.fn(),
}));

vi.mock("../../core/config/logger.js", () => ({
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

describe("Comment Controller", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  const mockPostId = "a1b2c3d4-e5f6-7890-1234-567890abcdef";
  const mockOtherPostId = "b2c3d4e5-f678-9012-3456-7890abcdef12";
  const mockUserId1 = "c3d4e5f6-7890-1234-5678-90abcdef1234";
  const mockUserId2 = "d4e5f678-9012-3456-7890-abcdef123456";

  beforeEach(() => {
    vi.clearAllMocks();

    mockResponse = {
      status: vi.fn(() => mockResponse as Response),
      json: vi.fn(),
    };
  });

  // ====================================================================================================
  // createComment tests
  // ====================================================================================================
  describe("createComment", () => {
    it("should create a new comment successfully when no parentId is provided", async () => {
      mockRequest = {
        user: {
          id: mockUserId1,
          role: "STUDENT" as Role,
          username: "test_username",
          email: "test_email",
        },
        params: { id: mockPostId },
        body: { content: "This is a new comment." },
      };

      vi.mocked(prisma.post.findUnique).mockResolvedValue({
        id: mockPostId,
        title: "Test Post",
        authorId: mockUserId1,
        content: "Some post content",
        createdAt: new Date(),
        updatedAt: new Date(),
        type: "NOTE",
        fileUrl: null,
        fileName: null,
        fileSize: null,
        mimeType: null,
      } as Post);

      vi.mocked(prisma.comment.create).mockResolvedValue({
        id: 1,
        content: "This is a new comment.",
        authorId: mockUserId1,
        postId: mockPostId,
        parentId: null,
        createdAt: new Date(),
      });

      await createComment(mockRequest as Request, mockResponse as Response);

      expect(PostIdParamSchema.parse).toHaveBeenCalledWith({ id: mockPostId });
      expect(CreateCommentSchema.parse).toHaveBeenCalledWith({
        content: "This is a new comment.",
      });

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Comment created successfully",
        data: expect.objectContaining({
          id: 1,
          content: "This is a new comment.",
          authorId: mockUserId1,
          postId: mockPostId,
          parentId: null,
        }),
      });
      expect(prisma.comment.create).toHaveBeenCalledWith({
        data: {
          content: "This is a new comment.",
          authorId: mockUserId1,
          postId: mockPostId,
          parentId: null,
        },
      });
    });

    it("should create a reply comment successfully when a valid parentId is provided", async () => {
      mockRequest = {
        user: {
          id: mockUserId1,
          role: "STUDENT" as Role,
          username: "test_username",
          email: "test_email",
        },
        params: { id: mockPostId },
        body: { content: "This is a reply.", parentId: 2 },
      };

      vi.mocked(prisma.post.findUnique).mockResolvedValue({
        id: mockPostId,
        title: "Test Post",
        authorId: mockUserId1,
        content: "Some post content",
        createdAt: new Date(),
        updatedAt: new Date(),
        type: "NOTE",
        fileUrl: null,
        fileName: null,
        fileSize: null,
        mimeType: null,
      } as Post);
      vi.mocked(prisma.comment.findUnique).mockResolvedValue({
        id: 2,
        content: "Parent comment",
        authorId: mockUserId2,
        postId: mockPostId,
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Comment);
      vi.mocked(prisma.comment.create).mockResolvedValue({
        id: 3,
        content: "This is a reply.",
        authorId: mockUserId1,
        postId: mockPostId,
        parentId: 2,
        createdAt: new Date(),
      });

      await createComment(mockRequest as Request, mockResponse as Response);

      expect(PostIdParamSchema.parse).toHaveBeenCalledWith({ id: mockPostId });
      expect(CreateCommentSchema.parse).toHaveBeenCalledWith({
        content: "This is a reply.",
        parentId: 2,
      });

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Comment created successfully",
        data: expect.objectContaining({
          id: 3,
          parentId: 2,
        }),
      });
      expect(prisma.comment.create).toHaveBeenCalledWith({
        data: {
          content: "This is a reply.",
          authorId: mockUserId1,
          postId: mockPostId,
          parentId: 2,
        },
      });
    });

    it("should call handleError with AuthenticationError when user is not authenticated", async () => {
      mockRequest = {
        user: undefined,
        params: { id: mockPostId },
        body: { content: "Unauthorized comment." },
      };

      await createComment(mockRequest as Request, mockResponse as Response);

      expect(handleError).toHaveBeenCalledWith(
        expect.any(AuthenticationError),
        mockResponse
      );
      expect(prisma.comment.create).not.toHaveBeenCalled();
    });

    it("should return 404 if the post does not exist", async () => {
      mockRequest = {
        user: {
          id: mockUserId1,
          role: "STUDENT" as Role,
          username: "test_username",
          email: "test_email",
        },
        params: { id: mockPostId },
        body: { content: "Non-existent post comment." },
      };

      vi.mocked(prisma.post.findUnique).mockResolvedValue(null);

      await createComment(mockRequest as Request, mockResponse as Response);

      expect(PostIdParamSchema.parse).toHaveBeenCalledWith({ id: mockPostId });
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Post not found!",
      });
      expect(prisma.comment.create).not.toHaveBeenCalled();
    });

    it("should return 404 if parent comment does not exist when parentId is provided", async () => {
      mockRequest = {
        user: {
          id: mockUserId1,
          role: "STUDENT" as Role,
          username: "test_username",
          email: "test_email",
        },
        params: { id: mockPostId },
        body: { content: "Reply to non-existent parent.", parentId: 999 },
      };

      vi.mocked(prisma.post.findUnique).mockResolvedValue({
        id: mockPostId,
        title: "Test Post",
        authorId: mockUserId1,
        content: "Some post content",
        createdAt: new Date(),
        updatedAt: new Date(),
        type: "NOTE",
        fileUrl: null,
        fileName: null,
        fileSize: null,
        mimeType: null,
      } as Post);
      vi.mocked(prisma.comment.findUnique).mockResolvedValue(null);

      await createComment(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Parent comment not found",
      });
      expect(prisma.comment.create).not.toHaveBeenCalled();
    });

    it("should return 400 if parent comment belongs to a different post", async () => {
      mockRequest = {
        user: {
          id: mockUserId1,
          role: "STUDENT" as Role,
          username: "test_username",
          email: "test_email",
        },
        params: { id: mockPostId },
        body: { content: "Reply to wrong post.", parentId: 2 },
      };

      vi.mocked(prisma.post.findUnique).mockResolvedValue({
        id: mockPostId,
        title: "Test Post",
        authorId: mockUserId1,
        content: "Some post content",
        createdAt: new Date(),
        updatedAt: new Date(),
        type: "NOTE",
        fileUrl: null,
        fileName: null,
        fileSize: null,
        mimeType: null,
      } as Post);
      vi.mocked(prisma.comment.findUnique).mockResolvedValue({
        id: 2,
        content: "Parent comment",
        authorId: mockUserId2,
        postId: mockOtherPostId,
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Comment);

      await createComment(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Parent comment does not belong to this post",
      });
      expect(prisma.comment.create).not.toHaveBeenCalled();
    });

    it("should call handleError for unexpected errors", async () => {
      mockRequest = {
        user: {
          id: mockUserId1,
          role: "STUDENT" as Role,
          username: "test_username",
          email: "test_email",
        },
        params: { id: mockPostId },
        body: { content: "Error test." },
      };

      const error = new Error("Database connection failed");
      vi.mocked(prisma.post.findUnique).mockRejectedValue(error);

      await createComment(mockRequest as Request, mockResponse as Response);

      expect(handleError).toHaveBeenCalledWith(error, mockResponse);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  // ====================================================================================================
  // getReplies tests
  // ====================================================================================================
  describe("getReplies", () => {
    it("should return a list of replies with pagination data", async () => {
      mockRequest = {
        params: { id: "1" },
        query: { limit: "2" },
      };

      const mockComments = [
        {
          id: 7,
          content: "Reply 3",
          author: { id: "authorC", username: "userC", avatarUrl: null },
          createdAt: new Date(),
          parentId: 1,
          postId: "post123",
          authorId: "authorC",
        },
        {
          id: 6,
          content: "Reply 2",
          author: { id: "authorB", username: "userB", avatarUrl: null },
          createdAt: new Date(),
          parentId: 1,
          postId: "post123",
          authorId: "authorB",
        },
        {
          id: 5,
          content: "Reply 1",
          author: { id: "authorA", username: "userA", avatarUrl: null },
          createdAt: new Date(),
          parentId: 1,
          postId: "post123",
          authorId: "authorA",
        },
      ];

      vi.mocked(prisma.comment.findUnique).mockResolvedValue({
        id: 1,
        content: "test content",
        parentId: null,
        postId: "abc",
        authorId: "def",
        createdAt: new Date(),
      });

      vi.mocked(prisma.comment.findMany).mockResolvedValue(mockComments);
      vi.mocked(prisma.comment.count).mockResolvedValue(12);

      await getReplies(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: mockComments.slice(0, 2),
        pagination: {
          nextCursor: 6,
          hasMore: true,
          totalItems: 12,
        },
      });

      expect(prisma.comment.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.comment.count).toHaveBeenCalledTimes(1);

      expect(prisma.comment.count).toHaveBeenCalledWith({
        where: { parentId: 1 },
      });
    });

    it("should return a list of replies with cursor", async () => {
      mockRequest = {
        params: { id: "1" },
        query: { limit: "2", cursor: "10" },
      };

      const mockComments = [
        {
          id: 9,
          content: "Reply after cursor",
          author: { id: "authorD", username: "userD", avatarUrl: null },
          createdAt: new Date(),
          parentId: 1,
          postId: "post123",
          authorId: "authorD",
        },
        {
          id: 8,
          content: "Another reply after cursor",
          author: { id: "authorE", username: "userE", avatarUrl: null },
          createdAt: new Date(),
          parentId: 1,
          postId: "post123",
          authorId: "authorE",
        },
      ];

      vi.mocked(prisma.comment.findUnique).mockResolvedValue({
        id: 1,
        content: "test content",
        parentId: null,
        postId: "abc",
        authorId: "def",
        createdAt: new Date(),
      });

      vi.mocked(prisma.comment.findMany).mockResolvedValue(mockComments);
      vi.mocked(prisma.comment.count).mockResolvedValue(12);

      await getReplies(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: mockComments,
        pagination: {
          nextCursor: null,
          hasMore: false,
          totalItems: 12,
        },
      });

      expect(prisma.comment.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.comment.count).toHaveBeenCalledTimes(1);

      expect(prisma.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { parentId: 1 },
          orderBy: { createdAt: "asc" },
          take: 3,
          cursor: { id: 10 },
          skip: 1,
          select: expect.objectContaining({
            id: true,
            content: true,
            author: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
            createdAt: true,
          }),
        })
      );

      expect(prisma.comment.count).toHaveBeenCalledWith({
        where: { parentId: 1 },
      });
    });

    it("should return 400 if the parent ID is not a number", async () => {
      mockRequest = {
        params: { id: "abc" },
        query: {},
      };

      await getReplies(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Invalid parent ID!",
      });
      expect(prisma.comment.findMany).not.toHaveBeenCalled();
    });

    it("should return 404 if the parent is not a found", async () => {
      mockRequest = {
        params: { id: "1" },
        query: {},
      };

      vi.mocked(prisma.comment.findUnique).mockResolvedValue(null);

      await getReplies(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Parent comment not found",
      });
      expect(prisma.comment.findMany).not.toHaveBeenCalled();
    });

    it("should use default pagination values if none are provided", async () => {
      mockRequest = {
        params: { id: "1" },
        query: {},
      };

      vi.mocked(prisma.comment.findUnique).mockResolvedValue({
        id: 1,
        content: "test content",
        parentId: null,
        postId: "abc",
        authorId: "def",
        createdAt: new Date(),
      });

      vi.mocked(prisma.comment.findMany).mockResolvedValue([]);
      vi.mocked(prisma.comment.count).mockResolvedValue(0);

      await getReplies(mockRequest as Request, mockResponse as Response);

      expect(prisma.comment.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.comment.count).toHaveBeenCalledTimes(1);

      expect(prisma.comment.count).toHaveBeenCalledWith({
        where: { parentId: 1 },
      });

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          pagination: expect.objectContaining({
            nextCursor: null,
            hasMore: false,
            totalItems: 0,
          }),
        })
      );
    });

    it("should call handleError for unexpected errors", async () => {
      mockRequest = {
        params: { id: "1" },
        query: {},
      };

      const error = new Error("Database error on transaction");
      vi.mocked(prisma.comment.findUnique).mockRejectedValue(error);

      await getReplies(mockRequest as Request, mockResponse as Response);

      expect(handleError).toHaveBeenCalledWith(error, mockResponse);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  // ====================================================================================================
  // deleteComment tests
  // ====================================================================================================
  describe("deleteComment", () => {
    // Happy path: author deletes their own comment
    it("should delete the comment successfully if the user is the author", async () => {
      mockRequest = {
        user: {
          id: mockUserId1,
          role: "STUDENT" as Role,
          username: "test_username",
          email: "test_email",
        },
        params: { id: "5" },
      };

      vi.mocked(prisma.comment.findUnique).mockResolvedValue({
        id: 5,
        authorId: mockUserId1, // User is the author
        postId: mockPostId,
        content: "Test comment",
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Comment);
      vi.mocked(prisma.comment.delete).mockResolvedValue({} as any);

      await deleteComment(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Comment deleted successfully",
      });
      expect(prisma.comment.delete).toHaveBeenCalledWith({
        where: { id: 5 },
      });
    });

    // Happy path: admin deletes a comment
    it("should delete the comment successfully if the user is an ADMIN", async () => {
      mockRequest = {
        user: {
          id: mockUserId2,
          role: "ADMIN" as Role,
          username: "admin_user",
          email: "admin@example.com",
        },
        params: { id: "6" },
      };

      vi.mocked(prisma.comment.findUnique).mockResolvedValue({
        id: 6,
        authorId: mockUserId1, // User is not the author, but has admin role
        postId: mockPostId,
        content: "Admin test comment",
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Comment);
      vi.mocked(prisma.comment.delete).mockResolvedValue({} as any);

      await deleteComment(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Comment deleted successfully",
      });
      expect(prisma.comment.delete).toHaveBeenCalledWith({
        where: { id: 6 },
      });
    });

    // Business logic test: unauthorized user (not logged in)
    it("should call handleError with AuthenticationError when user is not authenticated", async () => {
      mockRequest = {
        user: undefined,
        params: { id: "5" },
      };

      await deleteComment(mockRequest as Request, mockResponse as Response);

      expect(handleError).toHaveBeenCalledWith(
        expect.any(AuthenticationError),
        mockResponse
      );
      expect(prisma.comment.delete).not.toHaveBeenCalled();
    });

    // Business logic test: comment not found
    it("should return 404 if the comment does not exist", async () => {
      mockRequest = {
        user: {
          id: mockUserId1,
          role: "STUDENT" as Role,
          username: "test_username",
          email: "test_email",
        },
        params: { id: "999" },
      };

      vi.mocked(prisma.comment.findUnique).mockResolvedValue(null);

      await deleteComment(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Comment not found",
      });
      expect(prisma.comment.delete).not.toHaveBeenCalled();
    });

    // Business logic test: unauthorized user (not author and not admin)
    it("should call handleError with AuthorizationError when user is not the author or an admin", async () => {
      mockRequest = {
        user: {
          id: mockUserId1,
          role: "STUDENT" as Role,
          username: "test_username",
          email: "test_email",
        },
        params: { id: "5" },
      };

      // FIX: Changed the mocked authorId to a different user, so the current user is not the author.
      vi.mocked(prisma.comment.findUnique).mockResolvedValue({
        id: 5,
        authorId: mockUserId2, // Another user is the author
        postId: mockPostId,
        content: "Test comment",
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Comment);

      await deleteComment(mockRequest as Request, mockResponse as Response);

      expect(handleError).toHaveBeenCalledWith(
        expect.any(AuthorizationError),
        mockResponse
      );
      expect(prisma.comment.delete).not.toHaveBeenCalled();
    });

    // Integration test: handleError is called on an unexpected error
    it("should call handleError for unexpected errors", async () => {
      mockRequest = {
        user: {
          id: mockUserId1,
          role: "STUDENT" as Role,
          username: "test_username",
          email: "test_email",
        },
        params: { id: "5" },
      };

      const error = new Error("Database deletion failed");
      vi.mocked(prisma.comment.findUnique).mockRejectedValue(error);

      await deleteComment(mockRequest as Request, mockResponse as Response);

      expect(handleError).toHaveBeenCalledWith(error, mockResponse);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });
});
