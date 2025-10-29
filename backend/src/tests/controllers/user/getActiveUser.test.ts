import { Prisma } from "@prisma/client";
import { Request, Response } from "express";

import { getActiveUser } from "../../../controllers/user.controller";
import prisma from "../../../core/config/db";
import { handleError } from "../../../core/error";
import { UserNotFoundError } from "../../../core/error/custom/user.error";

import { expectValidationError } from "./shared/helpers";
import {
  createMockRequest,
  createMockResponse,
  mockUser,
} from "./shared/mocks";

// Prisma mocks
vi.mock("../../../core/config/db.js", () => ({
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
    comment: {
      findMany: vi.fn(),
    },
  },
}));

// Logger mocks
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

// Error handler mocks
vi.mock("../../../core/error/index.js", () => ({
  handleError: vi.fn(),
}));

describe("getActiveUser controller", () => {
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
      await expectValidationError(getActiveUser, {
        user: undefined,
      });
    });
  });

  describe("User Not Found Cases", () => {
    it("should call handleError when authenticated user is not found in database", async () => {
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
      expect(handleError).toHaveBeenCalledWith(
        expect.any(UserNotFoundError),
        mockRes
      );
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

      expect(handleError).toHaveBeenCalledWith(
        expect.any(UserNotFoundError),
        mockRes
      );
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
      vi.mocked(prisma.user.findUnique).mockResolvedValue(userWithSpecialChars);

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
