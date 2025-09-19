import { updateUserProfile } from "../../../controllers/user.controller.js";
import prisma from "../../../core/config/db.js";
import { AuthenticationError } from "../../../core/error/custom/auth.error.js";
import { handleError } from "../../../core/error/index.js";

import {
  createAuthenticatedUser,
  expectValidationError,
} from "./shared/helpers.js";
import {
  mockUser,
  createMockRequest,
  createMockResponse,
} from "./shared/mocks.js";

import type { Request, Response } from "express";

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

describe("updateUserProfile controller", () => {
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
    it("should update user profile with valid data", async () => {
      mockReq.user = createAuthenticatedUser();
      mockReq.body = {
        bio: "Updated bio",
        avatarId: 1,
      };

      const updatedUser = {
        ...mockUser,
        bio: "Updated bio",
        avatar: { id: 1, url: "http://example.come/avatar.svg" },
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);

      (prisma.user.update as any).mockResolvedValue(updatedUser);

      await updateUserProfile(mockReq, mockRes);

      expect(prisma.user.update).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String),
          user: expect.objectContaining({
            id: updatedUser.id,
            bio: updatedUser.bio,
          }),
        })
      );
    });

    it("should update user profile with only bio", async () => {
      mockReq.user = createAuthenticatedUser();
      mockReq.body = { bio: "New bio only" };
      const updatedUser = {
        ...mockUser,
        bio: "New bio only",
        avatar: { id: 123, url: "http://example.come/avatar.svg" },
      };
      (prisma.user.findUnique as any).mockResolvedValue(mockUser);

      (prisma.user.update as any).mockResolvedValue(updatedUser);

      await updateUserProfile(mockReq, mockRes);

      expect(prisma.user.update).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String),
          user: expect.objectContaining({
            id: updatedUser.id,
            username: updatedUser.username,
            email: updatedUser.email,
            bio: updatedUser.bio,
          }),
        })
      );
    });

    it("should update user profile with only avatarId", async () => {
      mockReq.user = createAuthenticatedUser();
      mockReq.body = { avatarId: 1 };
      const updatedUser = {
        ...mockUser,
        avatar: { id: 1, url: "http://example.come/avatar.svg" },
      };
      (prisma.user.findUnique as any).mockResolvedValue(mockUser);

      (prisma.user.update as any).mockResolvedValue(updatedUser);

      await updateUserProfile(mockReq, mockRes);

      expect(handleError).not.toHaveBeenCalled();
      expect(prisma.user.update).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String),
          user: expect.objectContaining({
            id: updatedUser.id,
            username: updatedUser.username,
            email: updatedUser.email,
            bio: updatedUser.bio,
          }),
        })
      );
    });
  });

  describe("Validation Errors", () => {
    it("should handle empty request body", async () => {
      await expectValidationError(updateUserProfile, {
        user: createAuthenticatedUser(),
        body: {},
      });
    });

    it("should handle empty strings for both bio and avatarUrl", async () => {
      await expectValidationError(updateUserProfile, {
        user: createAuthenticatedUser(),
        body: { bio: "", avatarUrl: "" },
      });

      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("should handle bio that is too long", async () => {
      await expectValidationError(updateUserProfile, {
        user: createAuthenticatedUser(),
        body: {
          bio: "x".repeat(161),
        },
      });

      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("should handle invalid avatar URL format", async () => {
      await expectValidationError(updateUserProfile, {
        user: createAuthenticatedUser(),
        body: { avatarUrl: "invalid-url" },
      });
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("should handle avatar URL without image extension", async () => {
      await expectValidationError(updateUserProfile, {
        user: createAuthenticatedUser(),
        body: { avatarUrl: "https://example.com/not-an-image" },
      });
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("should handle non-HTTPS/HTTP avatar URL", async () => {
      await expectValidationError(updateUserProfile, {
        user: createAuthenticatedUser(),
        body: { avatarUrl: "ftp://example.com/avatar.jpg" },
      });
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("should handle invalid data types in request body", async () => {
      await expectValidationError(updateUserProfile, {
        user: createAuthenticatedUser(),
        body: {
          bio: 123,
          avatarUrl: true,
        },
      });
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
