import { Like, Post, Role } from "@prisma/client";
import { Request, Response } from "express";
import { it, expect, describe, vi, beforeEach } from "vitest";

import { toggleLike } from "../../controllers/reaction.controller";
import prisma from "../../core/config/db.js";
import { createLogger } from "../../core/config/logger.js";
import { AuthenticationError } from "../../core/error/custom/auth.error";
import { handleError } from "../../core/error/index";
import { PostIdParamSchema } from "../../zodSchemas/post.zod.js";

vi.mock("../../core/config/db.js", () => ({
  default: {
    post: {
      findUnique: vi.fn(),
    },
    like: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}));
vi.mock("../../core/error/index");

vi.mock("../../zodSchemas/post.zod.js", () => ({
  PostIdParamSchema: {
    parse: vi.fn(),
  },
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

describe("Reaction controller", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  const mockPostId = "a1b2c3d4-e5f6-7890-1234-567890abcdef";
  const mockUserId = "c3d4e5f6-7890-1234-5678-90abcdef1234";

  beforeEach(() => {
    vi.clearAllMocks();

    mockResponse = {
      status: vi.fn(() => mockResponse as Response),
      json: vi.fn(),
    };

    vi.mocked(PostIdParamSchema.parse).mockImplementation((params: any) => ({
      id: params.id,
    }));
  });

  describe("toggleLike", () => {
    it("should like a post successfully", async () => {
      mockRequest = {
        user: {
          id: mockUserId,
          role: "STUDENT" as Role,
          username: "test_username",
          email: "test_email",
        },
        params: { id: mockPostId },
      };

      vi.mocked(prisma.post.findUnique).mockResolvedValue({
        id: mockPostId,
        title: "Test Post",
        authorId: mockUserId,
        content: "Some post content",
        createdAt: new Date(),
        updatedAt: new Date(),
        type: "NOTE",
        fileUrl: null,
        fileName: null,
        fileSize: null,
        mimeType: null,
      } as Post);

      await toggleLike(mockRequest as Request, mockResponse as Response);

      expect(PostIdParamSchema.parse).toHaveBeenCalledWith({ id: mockPostId });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Post liked successfully",
      });
    });

    it("should unlike a post successfully", async () => {
      mockRequest = {
        user: {
          id: mockUserId,
          role: "STUDENT" as Role,
          username: "test_username",
          email: "test_email",
        },
        params: { id: mockPostId },
      };

      vi.mocked(prisma.post.findUnique).mockResolvedValue({
        id: mockPostId,
        title: "Test Post",
        authorId: mockUserId,
        content: "Some post content",
        createdAt: new Date(),
        updatedAt: new Date(),
        type: "NOTE",
        fileUrl: null,
        fileName: null,
        fileSize: null,
        mimeType: null,
      } as Post);

      vi.mocked(prisma.like.findUnique).mockResolvedValue({
        userId: mockUserId,
        postId: mockPostId,
      } as Like);

      await toggleLike(mockRequest as Request, mockResponse as Response);

      expect(PostIdParamSchema.parse).toHaveBeenCalledWith({ id: mockPostId });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Post unliked successfully",
      });
    });

    it("should call handleError with AuthenticationError when user is not authenticated", async () => {
      mockRequest = {
        user: undefined,
        params: { id: mockPostId },
      };

      await toggleLike(mockRequest as Request, mockResponse as Response);

      expect(PostIdParamSchema.parse).not.toHaveBeenCalled();
      expect(handleError).toHaveBeenCalledWith(
        expect.any(AuthenticationError),
        mockResponse
      );
      expect(prisma.post.findUnique).not.toHaveBeenCalled();
    });

    it("should return 404 if the post does not exist", async () => {
      mockRequest = {
        user: {
          id: mockUserId,
          role: "STUDENT" as Role,
          username: "test_username",
          email: "test_email",
        },
        params: { id: mockPostId },
      };

      vi.mocked(prisma.post.findUnique).mockResolvedValue(null);

      await toggleLike(mockRequest as Request, mockResponse as Response);

      expect(PostIdParamSchema.parse).toHaveBeenCalledWith({ id: mockPostId });
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "The post being reacted to is not found",
      });
    });

    it("should throw an error and call handleError if the post ID is invalid", async () => {
      mockRequest = {
        user: {
          id: mockUserId,
          role: "STUDENT" as Role,
          username: "test_username",
          email: "test_email",
        },
        params: { id: 1 as any },
      };

      vi.mocked(PostIdParamSchema.parse).mockImplementationOnce(() => {
        throw new Error("Invalid UUID format");
      });

      await toggleLike(mockRequest as Request, mockResponse as Response);

      expect(PostIdParamSchema.parse).toHaveBeenCalledWith({ id: 1 });
      expect(handleError).toHaveBeenCalled();
    });

    it("should handle database errors when creating a like", async () => {
      mockRequest = {
        user: {
          id: mockUserId,
          role: "STUDENT" as Role,
          username: "test_username",
          email: "test_email",
        },
        params: { id: mockPostId },
      };

      vi.mocked(prisma.post.findUnique).mockResolvedValue({
        id: mockPostId,
        title: "Test Post",
        authorId: mockUserId,
        content: "Some post content",
        createdAt: new Date(),
        updatedAt: new Date(),
        type: "NOTE",
        fileUrl: null,
        fileName: null,
        fileSize: null,
        mimeType: null,
      } as Post);

      vi.mocked(prisma.like.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.like.create).mockRejectedValue(
        new Error("Database connection failed")
      );

      await toggleLike(mockRequest as Request, mockResponse as Response);

      expect(handleError).toHaveBeenCalledWith(expect.any(Error), mockResponse);
      expect(prisma.like.create).toHaveBeenCalledWith({
        data: { userId: mockUserId, postId: mockPostId },
      });
    });

    it("should handle database errors when deleting a like", async () => {
      mockRequest = {
        user: {
          id: mockUserId,
          role: "STUDENT" as Role,
          username: "test_username",
          email: "test_email",
        },
        params: { id: mockPostId },
      };

      vi.mocked(prisma.post.findUnique).mockResolvedValue({
        id: mockPostId,
        title: "Test Post",
        authorId: mockUserId,
        content: "Some post content",
        createdAt: new Date(),
        updatedAt: new Date(),
        type: "NOTE",
        fileUrl: null,
        fileName: null,
        fileSize: null,
        mimeType: null,
      } as Post);

      vi.mocked(prisma.like.findUnique).mockResolvedValue({
        userId: mockUserId,
        postId: mockPostId,
      } as Like);

      vi.mocked(prisma.like.delete).mockRejectedValue(
        new Error("Database connection failed")
      );

      await toggleLike(mockRequest as Request, mockResponse as Response);

      expect(handleError).toHaveBeenCalledWith(expect.any(Error), mockResponse);
      expect(prisma.like.delete).toHaveBeenCalledWith({
        where: { userId_postId: { userId: mockUserId, postId: mockPostId } },
      });
    });

    it("should handle errors when fetching post and like data", async () => {
      mockRequest = {
        user: {
          id: mockUserId,
          role: "STUDENT" as Role,
          username: "test_username",
          email: "test_email",
        },
        params: { id: mockPostId },
      };

      vi.mocked(prisma.post.findUnique).mockRejectedValue(
        new Error("Database connection failed")
      );

      await toggleLike(mockRequest as Request, mockResponse as Response);

      expect(handleError).toHaveBeenCalledWith(expect.any(Error), mockResponse);
      expect(PostIdParamSchema.parse).toHaveBeenCalledWith({ id: mockPostId });
    });

    it("should handle errors when like query fails in Promise.all", async () => {
      mockRequest = {
        user: {
          id: mockUserId,
          role: "STUDENT" as Role,
          username: "test_username",
          email: "test_email",
        },
        params: { id: mockPostId },
      };

      vi.mocked(prisma.post.findUnique).mockResolvedValue({
        id: mockPostId,
        title: "Test Post",
        authorId: mockUserId,
        content: "Some post content",
        createdAt: new Date(),
        updatedAt: new Date(),
        type: "NOTE",
        fileUrl: null,
        fileName: null,
        fileSize: null,
        mimeType: null,
      } as Post);

      vi.mocked(prisma.like.findUnique).mockRejectedValue(
        new Error("Like query failed")
      );

      await toggleLike(mockRequest as Request, mockResponse as Response);

      expect(handleError).toHaveBeenCalledWith(expect.any(Error), mockResponse);
      expect(PostIdParamSchema.parse).toHaveBeenCalledWith({ id: mockPostId });
    });
  });
});
