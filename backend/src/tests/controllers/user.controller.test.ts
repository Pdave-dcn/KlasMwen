import { Prisma, User, type Role } from "@prisma/client";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  getUserById,
  updateUserProfile,
  getMyPosts,
  getActiveUser,
  getUserPosts,
  getPostsLikedByMe,
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
    like: {
      findMany: vi.fn(),
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

const mockUser: User = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  username: "testuser",
  password: "hash-password",
  email: "test@example.com",
  bio: "Test bio",
  avatarId: 1,
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

  describe("getActiveUser", () => {
    describe("Success Cases", () => {
      it("should return the authenticated user info", async () => {
        mockReq.user = {
          id: mockUser.id,
          username: mockUser.username,
          role: mockUser.role,
          email: mockUser.email,
        };
        vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

        await getActiveUser(mockReq, mockRes);

        expect(prisma.user.findUnique).toHaveBeenCalledWith(
          expect.objectContaining({ where: { id: mockUser.id } })
        );
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              id: mockUser.id,
              username: mockUser.username,
              email: mockUser.email,
              bio: mockUser.bio,
              role: mockUser.role,
            }),
          })
        );
      });

      it("should return user with null avatar when user has no avatar", async () => {
        const userWithoutAvatar = { ...mockUser, Avatar: null };
        mockReq.user = {
          id: mockUser.id,
          username: mockUser.username,
          role: mockUser.role,
          email: mockUser.email,
        };
        vi.mocked(prisma.user.findUnique).mockResolvedValue(userWithoutAvatar);

        await getActiveUser(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          data: expect.objectContaining({
            avatar: null,
          }),
        });
      });

      it("should return user with null bio when user has no bio", async () => {
        const userWithoutBio = { ...mockUser, bio: null };
        mockReq.user = {
          id: mockUser.id,
          username: mockUser.username,
          role: mockUser.role,
          email: mockUser.email,
        };
        vi.mocked(prisma.user.findUnique).mockResolvedValue(userWithoutBio);

        await getActiveUser(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          data: expect.objectContaining({
            bio: null,
          }),
        });
      });

      it("should select only the specified fields from database", async () => {
        mockReq.user = {
          id: mockUser.id,
          username: mockUser.username,
          role: mockUser.role,
          email: mockUser.email,
        };
        vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

        await getActiveUser(mockReq, mockRes);

        expect(prisma.user.findUnique).toHaveBeenCalledWith({
          where: { id: mockUser.id },
          select: {
            id: true,
            username: true,
            email: true,
            bio: true,
            Avatar: {
              select: { id: true, url: true },
            },
            role: true,
            createdAt: true,
          },
        });
      });
    });

    describe("Authentication Errors", () => {
      it("should handle unauthenticated request", async () => {
        mockReq.user = undefined;

        await getActiveUser(mockReq, mockRes);

        expect(handleError).toHaveBeenCalledWith(expect.any(Error), mockRes);
        expect(prisma.user.findUnique).not.toHaveBeenCalled();
      });
    });

    describe("User Not Found Cases", () => {
      it("should return 404 when authenticated user not found in database", async () => {
        mockReq.user = {
          id: mockUser.id,
          username: mockUser.username,
          role: mockUser.role,
          email: mockUser.email,
        };
        vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

        await getActiveUser(mockReq, mockRes);

        expect(prisma.user.findUnique).toHaveBeenCalledWith(
          expect.objectContaining({ where: { id: mockUser.id } })
        );
        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(mockRes.json).toHaveBeenCalledWith({
          message: "User not found",
        });
      });

      it("should handle case where user was deleted after authentication", async () => {
        const deletedUserId = "deleted-user-id";
        mockReq.user = {
          id: deletedUserId,
          username: "deletedUser",
          role: "STUDENT",
          email: "deleted@example.com",
        };
        vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

        await getActiveUser(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(mockRes.json).toHaveBeenCalledWith({
          message: "User not found",
        });
      });
    });

    describe("Database Errors", () => {
      it("should handle database connection errors", async () => {
        mockReq.user = {
          id: mockUser.id,
          username: mockUser.username,
          role: mockUser.role,
          email: mockUser.email,
        };
        const dbError = new Error("Database connection failed");
        vi.mocked(prisma.user.findUnique).mockRejectedValue(dbError);

        await getActiveUser(mockReq, mockRes);

        expect(handleError).toHaveBeenCalledWith(dbError, mockRes);
      });

      it("should handle Prisma known request errors", async () => {
        mockReq.user = {
          id: mockUser.id,
          username: mockUser.username,
          role: mockUser.role,
          email: mockUser.email,
        };
        const prismaError = new Prisma.PrismaClientKnownRequestError(
          "Database error",
          { code: "P2001", clientVersion: "5.0.0" }
        );
        vi.mocked(prisma.user.findUnique).mockRejectedValue(prismaError);

        await getActiveUser(mockReq, mockRes);

        expect(handleError).toHaveBeenCalledWith(prismaError, mockRes);
      });

      it("should handle database timeout errors", async () => {
        mockReq.user = {
          id: mockUser.id,
          username: mockUser.username,
          role: mockUser.role,
          email: mockUser.email,
        };
        const timeoutError = new Error("Database query timeout");
        vi.mocked(prisma.user.findUnique).mockRejectedValue(timeoutError);

        await getActiveUser(mockReq, mockRes);

        expect(handleError).toHaveBeenCalledWith(timeoutError, mockRes);
      });
    });

    describe("Response Format Validation", () => {
      it("should return response in correct format with all required fields", async () => {
        mockReq.user = {
          id: mockUser.id,
          username: mockUser.username,
          role: mockUser.role,
          email: mockUser.email,
        };
        vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

        await getActiveUser(mockReq, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              id: mockUser.id,
              username: mockUser.username,
              email: mockUser.email,
              bio: mockUser.bio,
            }),
          })
        );
      });

      it("should not expose sensitive fields in response", async () => {
        const userWithSensitiveData = {
          ...mockUser,
          password: "hashedpassword123",
          resetToken: "reset-token-123",
          refreshToken: "refresh-token-456",
        };
        mockReq.user = {
          id: mockUser.id,
          username: mockUser.username,
          role: mockUser.role,
          email: mockUser.email,
        };
        vi.mocked(prisma.user.findUnique).mockResolvedValue(
          userWithSensitiveData
        );

        await getActiveUser(mockReq, mockRes);

        const responseCall = vi.mocked(mockRes.json).mock.calls[0][0];
        expect(responseCall.data).not.toHaveProperty("password");
        expect(responseCall.data).not.toHaveProperty("resetToken");
        expect(responseCall.data).not.toHaveProperty("refreshToken");
      });
    });

    describe("Edge Cases", () => {
      it("should handle user with different role types", async () => {
        const adminUser = { ...mockUser, role: "ADMIN" as const };
        mockReq.user = {
          id: adminUser.id,
          username: adminUser.username,
          role: adminUser.role,
          email: adminUser.email,
        };
        vi.mocked(prisma.user.findUnique).mockResolvedValue(adminUser);

        await getActiveUser(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          data: expect.objectContaining({
            role: "ADMIN",
          }),
        });
      });

      it("should handle user with very long bio", async () => {
        const userWithLongBio = {
          ...mockUser,
          bio: "A".repeat(1000), // Very long bio
        };
        mockReq.user = {
          id: mockUser.id,
          username: mockUser.username,
          role: mockUser.role,
          email: mockUser.email,
        };
        vi.mocked(prisma.user.findUnique).mockResolvedValue(userWithLongBio);

        await getActiveUser(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          data: expect.objectContaining({
            bio: expect.stringMatching(/^A+$/),
          }),
        });
      });

      it("should handle user with special characters in username", async () => {
        const userWithSpecialChars = {
          ...mockUser,
          username: "user@#$%^&*()",
        };
        mockReq.user = {
          id: mockUser.id,
          username: userWithSpecialChars.username,
          role: mockUser.role,
          email: mockUser.email,
        };
        vi.mocked(prisma.user.findUnique).mockResolvedValue(
          userWithSpecialChars
        );

        await getActiveUser(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          data: expect.objectContaining({
            username: "user@#$%^&*()",
          }),
        });
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
        type: "NOTE",
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

  describe("getUserPosts", () => {
    const mockPostId = "550e8400-e29b-41d4-a716-446655440000";
    const mockPostId2 = "d4e5f678-9012-3456-7890-abcdef123456";

    const mockPosts = [
      {
        id: mockPostId,
        title: "Test Title",
        content: "Test Content",
        type: "NOTE" as const,
        fileUrl: null,
        fileName: null,
        fileSize: null,
        mimeType: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        authorId: mockUser.id,
        postTags: [],
        comments: [],
        _count: {
          comments: 0,
          likes: 0,
        },
      },
      {
        id: mockPostId2,
        title: "Test Post 2",
        content: "Content of test post 2",
        type: "NOTE" as const,
        fileUrl: null,
        fileName: null,
        fileSize: null,
        mimeType: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        authorId: mockUser.id,
        postTags: [],
        _count: { comments: 0, likes: 3 },
      },
    ];

    const mockTransformedPosts = [
      {
        id: mockPostId,
        title: "Test Title",
        content: "Test Content",
        type: "NOTE" as const,
        fileUrl: null,
        fileName: null,
        fileSize: null,
        mimeType: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        authorId: mockUser.id,
        tags: [],
        comments: [],
        _count: {
          comments: 0,
          likes: 0,
        },
      },
      {
        id: mockPostId2,
        title: "Test Post 2",
        content: "Content of test post 2",
        type: "NOTE" as const,
        fileUrl: null,
        fileName: null,
        fileSize: null,
        mimeType: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        authorId: mockUser.id,
        tags: [],
        _count: { comments: 0, likes: 3 },
      },
    ];

    describe("Success Cases", () => {
      it("should return user posts with default pagination", async () => {
        mockReq.params = { id: mockUser.id };
        mockReq.query = {};

        vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
        vi.mocked(prisma.post.findMany).mockResolvedValue(mockPosts);

        await getUserPosts(mockReq, mockRes);

        expect(prisma.user.findUnique).toHaveBeenCalledWith({
          where: { id: mockUser.id },
          select: { id: true },
        });
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          data: mockTransformedPosts,
          pagination: {
            hasMore: false,
            nextCursor: null,
          },
        });
      });

      it("should return empty posts array when user has no posts", async () => {
        mockReq.params = { id: mockUser.id };
        mockReq.query = {};

        vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
        vi.mocked(prisma.post.findMany).mockResolvedValue([]);

        await getUserPosts(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          data: [],
          pagination: {
            hasMore: false,
            nextCursor: null,
          },
        });
      });
    });

    describe("Validation Errors", () => {
      it("should handle invalid user ID format", async () => {
        mockReq.params = { id: "invalid-uuid" };
        mockReq.query = {};

        await getUserPosts(mockReq, mockRes);

        expect(handleError).toHaveBeenCalled();
        expect(prisma.user.findUnique).not.toHaveBeenCalled();
        expect(prisma.post.findMany).not.toHaveBeenCalled();
      });

      it("should handle missing user ID parameter", async () => {
        mockReq.params = {};
        mockReq.query = {};

        await getUserPosts(mockReq, mockRes);

        expect(handleError).toHaveBeenCalled();
        expect(prisma.user.findUnique).not.toHaveBeenCalled();
      });

      it("should handle invalid pagination parameters", async () => {
        mockReq.params = { id: mockUser.id };
        mockReq.query = { limit: "invalid", cursor: "not-a-uuid" };

        await getUserPosts(mockReq, mockRes);

        expect(handleError).toHaveBeenCalled();
        expect(prisma.user.findUnique).not.toHaveBeenCalled();
      });

      it("should handle negative limit values", async () => {
        mockReq.params = { id: mockUser.id };
        mockReq.query = { limit: "-5" };

        await getUserPosts(mockReq, mockRes);

        expect(handleError).toHaveBeenCalled();
      });
    });

    describe("User Not Found Cases", () => {
      it("should return 404 when user does not exist", async () => {
        mockReq.params = { id: mockUser.id };
        mockReq.query = {};

        vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

        await getUserPosts(mockReq, mockRes);

        expect(prisma.user.findUnique).toHaveBeenCalledWith({
          where: { id: mockUser.id },
          select: { id: true },
        });
        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(mockRes.json).toHaveBeenCalledWith({
          message: "User not found",
        });
        expect(prisma.post.findMany).not.toHaveBeenCalled();
      });
    });

    describe("Database Errors", () => {
      it("should handle database connection errors during user lookup", async () => {
        mockReq.params = { id: mockUser.id };
        mockReq.query = {};

        const dbError = new Error("Database connection failed");
        vi.mocked(prisma.user.findUnique).mockRejectedValue(dbError);

        await getUserPosts(mockReq, mockRes);

        expect(handleError).toHaveBeenCalledWith(dbError, mockRes);
        expect(prisma.post.findMany).not.toHaveBeenCalled();
      });

      it("should handle database errors during posts fetch", async () => {
        mockReq.params = { id: mockUser.id };
        mockReq.query = {};

        vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
        const dbError = new Error("Posts query failed");
        vi.mocked(prisma.post.findMany).mockRejectedValue(dbError);

        await getUserPosts(mockReq, mockRes);

        expect(handleError).toHaveBeenCalledWith(dbError, mockRes);
      });

      it("should handle Prisma known request errors", async () => {
        mockReq.params = { id: mockUser.id };
        mockReq.query = {};

        vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
        const prismaError = new Prisma.PrismaClientKnownRequestError(
          "Database constraint violation",
          { code: "P2002", clientVersion: "5.0.0" }
        );
        vi.mocked(prisma.post.findMany).mockRejectedValue(prismaError);

        await getUserPosts(mockReq, mockRes);

        expect(handleError).toHaveBeenCalledWith(prismaError, mockRes);
      });

      it("should handle database timeout errors", async () => {
        mockReq.params = { id: mockUser.id };
        mockReq.query = {};

        vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
        const timeoutError = new Error("Query timeout");
        vi.mocked(prisma.post.findMany).mockRejectedValue(timeoutError);

        await getUserPosts(mockReq, mockRes);

        expect(handleError).toHaveBeenCalledWith(timeoutError, mockRes);
      });
    });
  });

  describe("getPostsLikedByMe", () => {
    const mockLikedPostId1 = "123e4567-e89b-12d3-a456-426614174001";
    const mockLikedPostId2 = "456e7890-e89b-12d3-a456-426614174002";
    const mockLikedPostId3 = "789e0123-e89b-12d3-a456-426614174003";

    const mockUserId1 = "e496794b-8f98-4f13-9d83-fc0c3b968f81";
    const mockUserId2 = "d4e5f678-9012-3456-7890-abcdef123456";

    const mockLikeWithPosts = [
      {
        userId: mockUserId1,
        postId: mockLikedPostId1,
        post: {
          id: mockLikedPostId1,
          title: "Liked Post 1",
          content: "Content of liked post 1",
          type: "NOTE" as const,
          fileUrl: null,
          fileName: null,
          createdAt: new Date("2023-01-01T00:00:00Z"),
          author: {
            id: mockUserId2,
            username: "otheruser",
            Avatar: {
              id: 1,
              url: "https://example.com/avatar1.jpg",
            },
          },
          postTags: [
            {
              id: 1,
              postId: mockLikedPostId1,
              tag: { id: "tag-1", name: "javascript" },
            },
          ],
          _count: { comments: 3, likes: 8 },
        },
      },
      {
        userId: mockUserId1,
        postId: mockLikedPostId2,
        post: {
          id: mockLikedPostId2,
          title: "Liked Post 2",
          content: null,
          type: "RESOURCE" as const,
          fileUrl: "https://example.com/resource.pdf",
          fileName: "resource.pdf",
          createdAt: new Date("2023-01-02T00:00:00Z"),
          author: {
            id: mockUserId2,
            username: "anotheruser",
            Avatar: null,
          },
          postTags: [],
          _count: { comments: 1, likes: 15 },
        },
      },
      {
        userId: mockUserId1,
        postId: mockLikedPostId3,
        post: {
          id: "789e0123-e89b-12d3-a456-426614174003",
          title: "Liked Post 3",
          content: "This is the third liked post",
          type: "NOTE" as const,
          fileUrl: null,
          fileName: null,
          createdAt: new Date("2023-01-03T00:00:00Z"),
          author: {
            id: mockUserId2,
            username: "thirduser",
            Avatar: {
              id: 3,
              url: "https://example.com/avatar3.jpg",
            },
          },
          postTags: [
            {
              id: 2,
              postId: mockLikedPostId3,
              tag: { id: 2, name: "typescript" },
            },
          ],
          _count: { comments: 2, likes: 5 },
        },
      },
    ];

    describe("Success Cases", () => {
      it("should return user liked posts with default pagination", async () => {
        mockReq.user = createAuthenticatedUser();
        mockReq.query = {};

        vi.mocked(prisma.like.findMany).mockResolvedValue(mockLikeWithPosts);

        await getPostsLikedByMe(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.arrayContaining([
              expect.objectContaining({
                id: expect.any(String),
                title: expect.any(String),
                type: expect.any(String),
                createdAt: expect.any(Date),
                author: expect.any(Object),
                tags: expect.any(Array),
                _count: expect.any(Object),
              }),
            ]),
            pagination: {
              hasMore: false,
              nextCursor: null,
            },
          })
        );
      });

      it("should return user liked posts with custom pagination", async () => {
        mockReq.user = createAuthenticatedUser();
        mockReq.query = { limit: "2", cursor: mockLikedPostId1 };

        vi.mocked(prisma.like.findMany).mockResolvedValue(mockLikeWithPosts);

        await getPostsLikedByMe(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.arrayContaining([
              expect.objectContaining({
                id: expect.any(String),
                title: expect.any(String),
                type: expect.any(String),
                createdAt: expect.any(Date),
                author: expect.any(Object),
                tags: expect.any(Array),
                _count: expect.any(Object),
              }),
            ]),
            pagination: {
              hasMore: true,
              nextCursor: mockLikedPostId2,
            },
          })
        );
      });

      it("should return empty array when user has no liked posts", async () => {
        mockReq.user = createAuthenticatedUser();
        mockReq.query = {};

        vi.mocked(prisma.like.findMany).mockResolvedValue([]);

        await getPostsLikedByMe(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          data: [],
          pagination: {
            hasMore: false,
            nextCursor: null,
          },
        });
      });
    });

    describe("Authentication Errors", () => {
      it("should handle missing user in request", async () => {
        mockReq.user = undefined;
        mockReq.query = {};

        await getPostsLikedByMe(mockReq, mockRes);

        expect(handleError).toHaveBeenCalledWith(
          expect.any(AuthenticationError),
          mockRes
        );
        expect(prisma.like.findMany).not.toHaveBeenCalled();
      });

      it("should handle undefined user in request", async () => {
        mockReq.user = undefined;
        mockReq.query = {};

        await getPostsLikedByMe(mockReq, mockRes);

        expect(handleError).toHaveBeenCalledWith(
          expect.any(AuthenticationError),
          mockRes
        );
        expect(prisma.like.findMany).not.toHaveBeenCalled();
      });
    });

    describe("Validation Errors", () => {
      it("should handle invalid pagination parameters", async () => {
        mockReq.user = createAuthenticatedUser();
        mockReq.query = { limit: "invalid", cursor: "not-a-uuid" };

        await getPostsLikedByMe(mockReq, mockRes);

        expect(handleError).toHaveBeenCalled();
        expect(prisma.like.findMany).not.toHaveBeenCalled();
      });

      it("should handle negative limit values", async () => {
        mockReq.user = createAuthenticatedUser();
        mockReq.query = { limit: "-5" };

        await getPostsLikedByMe(mockReq, mockRes);

        expect(handleError).toHaveBeenCalled();
        expect(prisma.like.findMany).not.toHaveBeenCalled();
      });

      it("should handle invalid cursor format", async () => {
        mockReq.user = createAuthenticatedUser();
        mockReq.query = { limit: "10", cursor: "invalid-uuid-format" };

        await getPostsLikedByMe(mockReq, mockRes);

        expect(handleError).toHaveBeenCalled();
        expect(prisma.like.findMany).not.toHaveBeenCalled();
      });

      it("should handle zero limit", async () => {
        mockReq.user = createAuthenticatedUser();
        mockReq.query = { limit: "0" };

        await getPostsLikedByMe(mockReq, mockRes);

        expect(handleError).toHaveBeenCalled();
        expect(prisma.like.findMany).not.toHaveBeenCalled();
      });
    });

    describe("Database/Service Errors", () => {
      it("should handle Prisma database connection errors", async () => {
        mockReq.user = createAuthenticatedUser();
        mockReq.query = {};

        const dbError = new Error("Database connection failed");
        vi.mocked(prisma.like.findMany).mockRejectedValue(dbError);

        await getPostsLikedByMe(mockReq, mockRes);

        expect(handleError).toHaveBeenCalledWith(dbError, mockRes);
        expect(prisma.like.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { userId: mockReq.user.id },
          })
        );
      });

      it("should handle Prisma known request errors", async () => {
        mockReq.user = createAuthenticatedUser();
        mockReq.query = {};

        const prismaError = new Prisma.PrismaClientKnownRequestError(
          "Database constraint violation",
          { code: "P2002", clientVersion: "5.0.0" }
        );
        vi.mocked(prisma.like.findMany).mockRejectedValue(prismaError);

        await getPostsLikedByMe(mockReq, mockRes);

        expect(handleError).toHaveBeenCalledWith(prismaError, mockRes);
      });

      it("should handle database timeout errors", async () => {
        mockReq.user = createAuthenticatedUser();
        mockReq.query = {};

        const timeoutError = new Error("Query timeout");
        vi.mocked(prisma.like.findMany).mockRejectedValue(timeoutError);

        await getPostsLikedByMe(mockReq, mockRes);

        expect(handleError).toHaveBeenCalledWith(timeoutError, mockRes);
      });
    });

    describe("Edge Cases", () => {
      it("should handle malformed query parameters", async () => {
        mockReq.user = createAuthenticatedUser();
        mockReq.query = {
          limit: {},
          cursor: [],
        };

        await getPostsLikedByMe(mockReq, mockRes);

        expect(handleError).toHaveBeenCalled();
        expect(prisma.like.findMany).not.toHaveBeenCalled();
      });

      it("should handle empty string parameters", async () => {
        mockReq.user = createAuthenticatedUser();
        mockReq.query = { limit: "", cursor: "" };

        await getPostsLikedByMe(mockReq, mockRes);

        expect(handleError).toHaveBeenCalled();
        expect(prisma.like.findMany).not.toHaveBeenCalled();
      });

      it("should handle posts with missing author data", async () => {
        mockReq.user = createAuthenticatedUser();
        mockReq.query = {};

        const likesWithMissingAuthor = [
          {
            userId: mockUserId1,
            postId: mockLikedPostId1,
            post: {
              id: mockLikedPostId1,
              title: "Post with missing author",
              content: "Content",
              type: "NOTE" as const,
              fileUrl: null,
              fileName: null,
              createdAt: new Date("2023-01-01T00:00:00Z"),
              author: null, // Missing author
              postTags: [],
              _count: { comments: 0, likes: 1 },
            },
          },
        ];

        vi.mocked(prisma.like.findMany).mockResolvedValue(
          likesWithMissingAuthor
        );

        await getPostsLikedByMe(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.arrayContaining([
              expect.objectContaining({
                id: mockLikedPostId1,
                author: null,
              }),
            ]),
          })
        );
      });

      it("should handle posts with empty tag arrays", async () => {
        mockReq.user = createAuthenticatedUser();
        mockReq.query = {};

        const likesWithNoTags = [
          {
            userId: mockUserId1,
            postId: mockLikedPostId1,
            post: {
              id: mockLikedPostId1,
              title: "Post with no tags",
              content: "Content",
              type: "NOTE" as const,
              fileUrl: null,
              fileName: null,
              createdAt: new Date("2023-01-01T00:00:00Z"),
              author: {
                id: mockUserId2,
                username: "testuser",
                Avatar: null,
              },
              postTags: [], // No tags
              _count: { comments: 0, likes: 1 },
            },
          },
        ];

        vi.mocked(prisma.like.findMany).mockResolvedValue(likesWithNoTags);

        await getPostsLikedByMe(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.arrayContaining([
              expect.objectContaining({
                id: mockLikedPostId1,
                tags: [],
              }),
            ]),
          })
        );
      });
    });

    describe("Performance and Behavior", () => {
      it("should handle concurrent requests properly", async () => {
        mockReq.user = createAuthenticatedUser();
        mockReq.query = {};

        vi.mocked(prisma.like.findMany).mockResolvedValue([]);

        const promise1 = getPostsLikedByMe(mockReq, mockRes);
        const promise2 = getPostsLikedByMe(mockReq, mockRes);

        await Promise.all([promise1, promise2]);

        expect(prisma.like.findMany).toHaveBeenCalledTimes(2);
      });

      it("should properly transform post data through the service layer", async () => {
        mockReq.user = createAuthenticatedUser();
        mockReq.query = {};

        vi.mocked(prisma.like.findMany).mockResolvedValue(mockLikeWithPosts);

        await getPostsLikedByMe(mockReq, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.arrayContaining([
              expect.objectContaining({
                id: expect.any(String),
                title: expect.any(String),
                tags: expect.any(Array),
                author: expect.objectContaining({
                  id: expect.any(String),
                  username: expect.any(String),
                }),
              }),
            ]),
          })
        );
      });
    });
  });
});
