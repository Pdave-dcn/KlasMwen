import { Prisma, type Role } from "@prisma/client";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  getUserById,
  updateUserProfile,
  getMyPosts,
} from "../../controllers/user.controller.js";
import prisma from "../../core/config/db.js";
import { createLogger } from "../../core/config/logger.js";
import { AuthenticationError } from "../../core/error/custom/auth.error.js";
import { handleError } from "../../core/error/index.js";

import type { Request, Response } from "express";

vi.mock("../../core/config/db.js", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    post: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
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

vi.mock("../../core/error/index.js", () => ({
  handleError: vi.fn(),
}));

const createMockRequest = (overrides = {}) =>
  ({
    params: {},
    body: {},
    query: {},
    user: undefined,
    ...overrides,
  } as Request);

const createMockResponse = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
};

const mockUser = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  username: "testuser",
  email: "test@example.com",
  bio: "Test bio",
  avatarUrl: "https://example.com/avatar.jpg",
  role: "STUDENT" as Role,
  createdAt: new Date("2023-01-01"),
};

// Helper to create authenticated user for req.user
const createAuthenticatedUser = (overrides = {}) => ({
  id: "123e4567-e89b-12d3-a456-426614174000",
  username: "testuser",
  email: "test@example.com",
  role: "STUDENT" as Role,
  ...overrides,
});

describe("User Controller", () => {
  let mockReq: Request;
  let mockRes: Response;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("getUserById", () => {
    describe("Success Cases", () => {
      it("should return user when valid UUID is provided", async () => {
        mockReq.params = { id: mockUser.id };
        (prisma.user.findUnique as any).mockResolvedValue(mockUser);

        await getUserById(mockReq, mockRes);

        expect(prisma.user.findUnique).toHaveBeenCalledWith(
          expect.objectContaining({ where: { id: mockUser.id } })
        );
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({ data: mockUser });
      });

      it("should return 404 when user is not found", async () => {
        mockReq.params = { id: mockUser.id };
        (prisma.user.findUnique as any).mockResolvedValue(null);

        await getUserById(mockReq, mockRes);

        expect(prisma.user.findUnique).toHaveBeenCalledWith(
          expect.objectContaining({ where: { id: mockUser.id } })
        );
        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(mockRes.json).toHaveBeenCalledWith({
          message: "User not found",
        });
      });
    });

    describe("Validation Errors", () => {
      it("should handle invalid UUID format in params", async () => {
        mockReq.params = { id: "invalid-uuid" };

        await getUserById(mockReq, mockRes);

        expect(handleError).toHaveBeenCalledWith(
          expect.any(Error), // ZodError
          mockRes
        );
        expect(prisma.user.findUnique).not.toHaveBeenCalled();
      });

      it("should handle missing id parameter", async () => {
        mockReq.params = {}; // No id parameter

        await getUserById(mockReq, mockRes);

        expect(handleError).toHaveBeenCalledWith(
          expect.any(Error), // ZodError
          mockRes
        );
        expect(prisma.user.findUnique).not.toHaveBeenCalled();
      });

      it("should handle non-string id parameter", async () => {
        mockReq.params = { id: 123 as any };

        await getUserById(mockReq, mockRes);

        expect(handleError).toHaveBeenCalledWith(
          expect.any(Error), // ZodError
          mockRes
        );
        expect(prisma.user.findUnique).not.toHaveBeenCalled();
      });
    });

    describe("Database Errors", () => {
      it("should handle database connection errors", async () => {
        mockReq.params = { id: mockUser.id };
        const dbError = new Error("Database connection failed");
        (prisma.user.findUnique as any).mockRejectedValue(dbError);

        await getUserById(mockReq, mockRes);

        expect(handleError).toHaveBeenCalledWith(dbError, mockRes);
      });

      it("should handle Prisma known request errors", async () => {
        mockReq.params = { id: mockUser.id };
        const prismaError = new Prisma.PrismaClientKnownRequestError(
          "Database error",
          { code: "P2001", clientVersion: "5.0.0" }
        );
        (prisma.user.findUnique as any).mockRejectedValue(prismaError);

        await getUserById(mockReq, mockRes);

        expect(handleError).toHaveBeenCalledWith(prismaError, mockRes);
      });
    });
  });

  describe("updateUserProfile", () => {
    describe("Success Cases", () => {
      it("should update user profile with valid data", async () => {
        mockReq.user = createAuthenticatedUser();
        mockReq.body = {
          bio: "Updated bio",
          avatarId: 1,
        };

        const updatedUser = { ...mockUser, bio: "Updated bio" };

        (prisma.user.findUnique as any).mockResolvedValue(mockUser);

        (prisma.user.update as any).mockResolvedValue(updatedUser);

        await updateUserProfile(mockReq, mockRes);

        expect(prisma.user.update).toHaveBeenCalledWith({
          where: { id: mockUser.id },
          data: {
            bio: "Updated bio",
            avatarId: 1,
          },
          select: {
            id: true,
            username: true,
            bio: true,
            Avatar: {
              select: { id: true, url: true },
            },
            role: true,
          },
        });
        expect(mockRes.json).toHaveBeenCalledWith({
          message: "Profile updated successfully",
          data: updatedUser,
        });
      });

      it("should update user profile with only bio", async () => {
        mockReq.user = createAuthenticatedUser();
        mockReq.body = { bio: "New bio only" };
        const updatedUser = { ...mockUser, bio: "New bio only" };
        (prisma.user.findUnique as any).mockResolvedValue(mockUser);

        (prisma.user.update as any).mockResolvedValue(updatedUser);

        await updateUserProfile(mockReq, mockRes);

        expect(prisma.user.update).toHaveBeenCalledWith({
          where: { id: mockUser.id },
          data: {
            bio: "New bio only",
            avatarId: undefined,
          },
          select: {
            id: true,
            username: true,
            bio: true,
            Avatar: {
              select: { id: true, url: true },
            },
            role: true,
          },
        });
        expect(mockRes.json).toHaveBeenCalledWith({
          message: "Profile updated successfully",
          data: updatedUser,
        });
      });

      it("should update user profile with only avatarUrl", async () => {
        mockReq.user = createAuthenticatedUser();
        mockReq.body = { avatarId: 1 };
        const updatedUser = {
          ...mockUser,
          avatarId: 1,
        };
        (prisma.user.findUnique as any).mockResolvedValue(mockUser);

        (prisma.user.update as any).mockResolvedValue(updatedUser);

        await updateUserProfile(mockReq, mockRes);

        expect(handleError).not.toHaveBeenCalled();
        expect(prisma.user.update).toHaveBeenCalledWith({
          where: { id: mockUser.id },
          data: {
            bio: undefined,
            avatarId: 1,
          },
          select: {
            id: true,
            username: true,
            bio: true,
            Avatar: {
              select: { id: true, url: true },
            },
            role: true,
          },
        });
        expect(mockRes.json).toHaveBeenCalledWith({
          message: "Profile updated successfully",
          data: updatedUser,
        });
      });
    });

    describe("Validation Errors", () => {
      it("should handle empty request body", async () => {
        mockReq.user = createAuthenticatedUser();
        mockReq.body = {};

        await updateUserProfile(mockReq, mockRes);

        expect(handleError).toHaveBeenCalledWith(expect.any(Error), mockRes);
        expect(prisma.user.update).not.toHaveBeenCalled();
      });

      it("should handle empty strings for both bio and avatarUrl", async () => {
        mockReq.user = createAuthenticatedUser();
        mockReq.body = { bio: "", avatarUrl: "" };

        await updateUserProfile(mockReq, mockRes);

        expect(handleError).toHaveBeenCalledWith(expect.any(Error), mockRes);
        expect(prisma.user.update).not.toHaveBeenCalled();
      });

      it("should handle bio that is too long", async () => {
        mockReq.user = createAuthenticatedUser();
        mockReq.body = {
          bio: "x".repeat(161),
        };

        await updateUserProfile(mockReq, mockRes);

        expect(handleError).toHaveBeenCalledWith(expect.any(Error), mockRes);
        expect(prisma.user.update).not.toHaveBeenCalled();
      });

      it("should handle invalid avatar URL format", async () => {
        mockReq.user = createAuthenticatedUser();
        mockReq.body = {
          avatarUrl: "invalid-url",
        };

        await updateUserProfile(mockReq, mockRes);

        expect(handleError).toHaveBeenCalledWith(
          expect.any(Error), // ZodError
          mockRes
        );
        expect(prisma.user.update).not.toHaveBeenCalled();
      });

      it("should handle avatar URL without image extension", async () => {
        mockReq.user = createAuthenticatedUser();
        mockReq.body = {
          avatarUrl: "https://example.com/not-an-image",
        };

        await updateUserProfile(mockReq, mockRes);

        expect(handleError).toHaveBeenCalledWith(
          expect.any(Error), // ZodError
          mockRes
        );
        expect(prisma.user.update).not.toHaveBeenCalled();
      });

      it("should handle non-HTTPS/HTTP avatar URL", async () => {
        mockReq.user = createAuthenticatedUser();
        mockReq.body = {
          avatarUrl: "ftp://example.com/avatar.jpg",
        };

        await updateUserProfile(mockReq, mockRes);

        expect(handleError).toHaveBeenCalledWith(
          expect.any(Error), // ZodError
          mockRes
        );
        expect(prisma.user.update).not.toHaveBeenCalled();
      });

      it("should handle invalid data types in request body", async () => {
        mockReq.user = createAuthenticatedUser();
        mockReq.body = {
          bio: 123, // Should be string
          avatarUrl: true, // Should be string
        };

        await updateUserProfile(mockReq, mockRes);

        expect(handleError).toHaveBeenCalledWith(expect.any(Error), mockRes);
        expect(prisma.user.update).not.toHaveBeenCalled();
      });
    });

    describe("Authentication Errors", () => {
      it("should handle missing user in request", async () => {
        mockReq.user = undefined;
        mockReq.body = { bio: "New bio" };

        await updateUserProfile(mockReq, mockRes);

        expect(handleError).toHaveBeenCalledWith(
          expect.any(AuthenticationError),
          mockRes
        );

        expect(prisma.user.findUnique).not.toHaveBeenCalled();
        expect(prisma.user.update).not.toHaveBeenCalled();
      });
    });

    describe("Database Errors", () => {
      it("should handle user not found during update", async () => {
        mockReq.user = createAuthenticatedUser({ id: "non-existent-id" });
        mockReq.body = { bio: "New bio" };

        (prisma.user.findUnique as any).mockResolvedValue(null);

        await updateUserProfile(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(mockRes.json).toHaveBeenCalledWith({
          message: "User not found",
        });
        expect(handleError).not.toHaveBeenCalled();
      });

      it("should handle database connection errors during update", async () => {
        mockReq.user = createAuthenticatedUser();
        mockReq.body = { bio: "New bio" };

        (prisma.user.findUnique as any).mockResolvedValue(mockUser);

        const dbError = new Error("Database connection failed");
        (prisma.user.update as any).mockRejectedValue(dbError);

        await updateUserProfile(mockReq, mockRes);

        expect(handleError).toHaveBeenCalledWith(dbError, mockRes);
      });
    });
  });

  describe("getMyPosts", () => {
    const mockPosts = [
      {
        id: "123e4567-e89b-12d3-a456-426614174001",
        title: "Test Post",
        content: "Test content",
        authorId: mockUser.id,
        type: "TEXT",
        fileUrl: null,
        fileName: null,
        createdAt: new Date("2023-01-01T00:00:00Z"),
        postTags: [{ id: "tag-1", tag: { id: "tag-1", name: "test-tag" } }],
        _count: { comments: 5, likes: 10 },
      },
    ];

    describe("Success Cases", () => {
      it("should return user posts with pagination and total count", async () => {
        (prisma.post.findMany as any).mockResolvedValue(mockPosts);
        (prisma.post.count as any).mockResolvedValue(1);
        mockReq.user = createAuthenticatedUser();
        mockReq.query = { postLimit: "10", postCursor: undefined };

        await getMyPosts(mockReq, mockRes);

        expect(prisma.post.findMany).toHaveBeenCalledTimes(1);
        expect(prisma.post.count).toHaveBeenCalledTimes(1);

        expect(prisma.post.findMany).toHaveBeenCalledWith(
          expect.objectContaining({ where: { authorId: mockUser.id } })
        );
        expect(prisma.post.count).toHaveBeenCalledWith({
          where: { authorId: mockUser.id },
        });

        expect(mockRes.json).toHaveBeenCalledWith({
          data: expect.any(Array),
          pagination: {
            hasMore: false,
            nextCursor: null,
            totalPosts: 1,
          },
        });
      });

      it("should return empty posts with a total count of 0", async () => {
        (prisma.post.findMany as any).mockResolvedValue([]);
        (prisma.post.count as any).mockResolvedValue(0);
        mockReq.user = createAuthenticatedUser();
        mockReq.query = { postLimit: "10", postCursor: undefined };

        await getMyPosts(mockReq, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith({
          data: [],

          pagination: {
            hasMore: false,
            nextCursor: null,
            totalPosts: 0,
          },
        });
      });
    });

    describe("Authentication Errors", () => {
      it("should handle missing user in request", async () => {
        mockReq.user = undefined;
        mockReq.query = {};

        await getMyPosts(mockReq, mockRes);

        expect(handleError).toHaveBeenCalledWith(
          expect.any(AuthenticationError),
          mockRes
        );
        expect(prisma.post.findMany).not.toHaveBeenCalled();
        expect(prisma.post.count).not.toHaveBeenCalled();
      });
    });

    describe("Database Errors", () => {
      it("should handle database connection errors", async () => {
        mockReq.user = createAuthenticatedUser();
        mockReq.query = {};
        const dbError = new Error("Database connection failed");

        (prisma.post.findMany as any).mockRejectedValue(dbError);
        (prisma.post.count as any).mockResolvedValue(0);

        await getMyPosts(mockReq, mockRes);

        expect(handleError).toHaveBeenCalledWith(dbError, mockRes);
      });

      it("should handle Prisma known request errors", async () => {
        mockReq.user = createAuthenticatedUser();
        mockReq.query = {};
        const prismaError = new Prisma.PrismaClientKnownRequestError(
          "Database error",
          { code: "P2001", clientVersion: "5.0.0" }
        );

        (prisma.post.findMany as any).mockRejectedValue(prismaError);
        (prisma.post.count as any).mockResolvedValue(0);

        await getMyPosts(mockReq, mockRes);

        expect(handleError).toHaveBeenCalledWith(prismaError, mockRes);
      });
    });
  });

  describe("Integration", () => {
    it("should maintain consistent error handling across all functions", async () => {
      const error = new Error("Test error");

      mockReq.params = { id: mockUser.id };
      (prisma.user.findUnique as any).mockRejectedValue(error);
      await getUserById(mockReq, mockRes);
      expect(handleError).toHaveBeenCalledWith(error, mockRes);

      vi.clearAllMocks();

      mockReq.user = createAuthenticatedUser();
      mockReq.body = { bio: "test" };
      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      (prisma.user.update as any).mockRejectedValue(error);
      await updateUserProfile(mockReq, mockRes);
      expect(handleError).toHaveBeenCalledWith(error, mockRes);

      vi.clearAllMocks();

      mockReq.user = createAuthenticatedUser();
      (prisma.post.findMany as any).mockRejectedValue(error);
      (prisma.post.count as any).mockResolvedValue(0);
      await getMyPosts(mockReq, mockRes);
      expect(handleError).toHaveBeenCalledWith(error, mockRes);
    });
  });
});
