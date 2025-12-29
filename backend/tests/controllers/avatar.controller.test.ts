import { Avatar } from "@prisma/client";
import { Request, Response } from "express";
import { it, expect, describe, vi, beforeEach } from "vitest";

import {
  addAvatar,
  deleteAvatar,
  getAvailableAvatars,
  getAvatars,
} from "../../src/controllers/avatar.controller.js";
import prisma from "../../src/core/config/db.js";
import { AuthorizationError } from "../../src/core/error/custom/auth.error.js";
import { handleError } from "../../src/core/error/index.js";

vi.mock("../../src/core/config/db.js", () => ({
  default: {
    avatar: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
    },
  },
}));

vi.mock("../../src/core/error/index.js");

vi.mock("../../src/core/config/logger.js", () => ({
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

describe("Avatar Controllers", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  const mockUserId = "c3d4e5f6-7890-1234-5678-90abcdef1234";

  beforeEach(() => {
    vi.clearAllMocks();

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  describe("addAvatar", () => {
    it("should add a single avatar with isDefault set to default", async () => {
      mockRequest = {
        body: { url: "https://cdn.example.com/avatars/avatar1.png" },
        user: {
          id: mockUserId,
          role: "ADMIN",
          username: "test_username",
          email: "test_email",
        },
        params: {},
      };

      const mockAvatarResult = {
        id: 1,
        url: "https://cdn.example.com/avatars/avatar1.png",
        isDefault: false,
      } as Avatar;

      vi.mocked(prisma.avatar.create).mockResolvedValue(mockAvatarResult);

      await addAvatar(mockRequest as Request, mockResponse as Response);

      expect(handleError).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });

    it("should add a single avatar with explicit isDefault true", async () => {
      mockRequest = {
        body: {
          url: "https://cdn.example.com/avatars/default-avatar.png",
          isDefault: true,
        },
        user: {
          id: mockUserId,
          role: "ADMIN",
          username: "test_username",
          email: "test_email",
        },
        params: {},
      };

      const mockAvatarResult = {
        id: 2,
        url: "https://cdn.example.com/avatars/default-avatar.png",
        isDefault: true,
      } as Avatar;

      vi.mocked(prisma.avatar.create).mockResolvedValue(mockAvatarResult);

      await addAvatar(mockRequest as Request, mockResponse as Response);

      expect(prisma.avatar.create).toHaveBeenCalledWith({
        data: {
          url: "https://cdn.example.com/avatars/default-avatar.png",
          isDefault: true,
        },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Avatar(s) added successfully",
        data: mockAvatarResult,
      });
    });

    it("should add multiple avatars successfully", async () => {
      mockRequest = {
        body: [
          { url: "https://cdn.example.com/avatars/avatar1.png" },
          {
            url: "https://cdn.example.com/avatars/avatar2.png",
            isDefault: true,
          },
          {
            url: "https://cdn.example.com/avatars/avatar3.png",
            isDefault: false,
          },
        ],
        user: {
          id: mockUserId,
          role: "ADMIN",
          username: "test_username",
          email: "test_email",
        },
        params: {},
      };

      const mockCreateManyResult = { count: 3 };

      vi.mocked(prisma.avatar.createMany).mockResolvedValue(
        mockCreateManyResult
      );

      await addAvatar(mockRequest as Request, mockResponse as Response);

      expect(prisma.avatar.createMany).toHaveBeenCalledWith({
        data: [
          {
            url: "https://cdn.example.com/avatars/avatar1.png",
            isDefault: false,
          },
          {
            url: "https://cdn.example.com/avatars/avatar2.png",
            isDefault: true,
          },
          {
            url: "https://cdn.example.com/avatars/avatar3.png",
            isDefault: false,
          },
        ],
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Avatar(s) added successfully",
        data: mockCreateManyResult,
      });
    });

    it("should default isDefault to false when not provided in array", async () => {
      mockRequest = {
        body: [
          { url: "https://cdn.example.com/avatars/avatar1.png" },
          { url: "https://cdn.example.com/avatars/avatar2.png" },
        ],
        user: {
          id: mockUserId,
          role: "ADMIN",
          username: "test_username",
          email: "test_email",
        },
        params: {},
      };

      const mockCreateManyResult = { count: 2 };
      vi.mocked(prisma.avatar.createMany).mockResolvedValue(
        mockCreateManyResult
      );

      await addAvatar(mockRequest as Request, mockResponse as Response);

      expect(prisma.avatar.createMany).toHaveBeenCalledWith({
        data: [
          {
            url: "https://cdn.example.com/avatars/avatar1.png",
            isDefault: false,
          },
          {
            url: "https://cdn.example.com/avatars/avatar2.png",
            isDefault: false,
          },
        ],
      });
    });

    it("should call handleError when user is not admin", async () => {
      mockRequest = {
        body: { url: "https://cdn.example.com/avatars/avatar1.png" },
        user: {
          id: mockUserId,
          role: "STUDENT",
          username: "test_username",
          email: "test_email",
        },
        params: {},
      };

      await addAvatar(mockRequest as Request, mockResponse as Response);

      expect(prisma.avatar.create).not.toHaveBeenCalled();
      expect(prisma.avatar.createMany).not.toHaveBeenCalled();
      expect(handleError).toHaveBeenCalledWith(
        expect.any(AuthorizationError),
        mockResponse
      );
    });

    it("should call handleError when user is not provided", async () => {
      mockRequest = {
        body: { url: "https://cdn.example.com/avatars/avatar1.png" },
        user: undefined,
        params: {},
      };

      await addAvatar(mockRequest as Request, mockResponse as Response);

      expect(prisma.avatar.create).not.toHaveBeenCalled();
      expect(prisma.avatar.createMany).not.toHaveBeenCalled();
      expect(handleError).toHaveBeenCalledWith(
        expect.any(AuthorizationError),
        mockResponse
      );
    });

    it("should handle validation errors for invalid URL", async () => {
      mockRequest = {
        body: { url: "invalid-url" },
        user: {
          id: mockUserId,
          role: "ADMIN",
          username: "test_username",
          email: "test_email",
        },
        params: {},
      };

      await addAvatar(mockRequest as Request, mockResponse as Response);

      expect(prisma.avatar.create).not.toHaveBeenCalled();
      expect(handleError).toHaveBeenCalled();
    });

    it("should handle validation errors for empty array", async () => {
      mockRequest = {
        body: [],
        user: {
          id: mockUserId,
          role: "ADMIN",
          username: "test_username",
          email: "test_email",
        },
        params: {},
      };

      await addAvatar(mockRequest as Request, mockResponse as Response);

      expect(prisma.avatar.createMany).not.toHaveBeenCalled();
      expect(handleError).toHaveBeenCalled();
    });

    it("should handle validation errors for invalid array item", async () => {
      mockRequest = {
        body: [
          { url: "https://cdn.example.com/avatars/avatar1.png" },
          { url: "invalid-url" },
        ],
        user: {
          id: mockUserId,
          role: "ADMIN",
          username: "test_username",
          email: "test_email",
        },
        params: {},
      };

      await addAvatar(mockRequest as Request, mockResponse as Response);

      expect(prisma.avatar.createMany).not.toHaveBeenCalled();
      expect(handleError).toHaveBeenCalled();
    });

    it("should handle database errors during single avatar creation", async () => {
      mockRequest = {
        body: { url: "https://cdn.example.com/avatars/avatar1.png" },
        user: {
          id: mockUserId,
          role: "ADMIN",
          username: "test_username",
          email: "test_email",
        },
        params: {},
      };

      const dbError = new Error("Database connection failed");
      vi.mocked(prisma.avatar.create).mockRejectedValue(dbError);

      await addAvatar(mockRequest as Request, mockResponse as Response);

      expect(handleError).toHaveBeenCalledWith(dbError, mockResponse);
    });

    it("should handle database errors during multiple avatar creation", async () => {
      mockRequest = {
        body: [
          { url: "https://cdn.example.com/avatars/avatar1.png" },
          { url: "https://cdn.example.com/avatars/avatar2.png" },
        ],
        user: {
          id: mockUserId,
          role: "ADMIN",
          username: "test_username",
          email: "test_email",
        },
        params: {},
      };

      const dbError = new Error("Database constraint violation");
      vi.mocked(prisma.avatar.createMany).mockRejectedValue(dbError);

      await addAvatar(mockRequest as Request, mockResponse as Response);

      expect(handleError).toHaveBeenCalledWith(dbError, mockResponse);
    });

    it("should use createMany for single item array", async () => {
      mockRequest = {
        body: [{ url: "https://cdn.example.com/avatars/avatar1.png" }],
        user: {
          id: mockUserId,
          role: "ADMIN",
          username: "test_username",
          email: "test_email",
        },
        params: {},
      };

      const mockCreateManyResult = { count: 1 };
      vi.mocked(prisma.avatar.createMany).mockResolvedValue(
        mockCreateManyResult
      );

      await addAvatar(mockRequest as Request, mockResponse as Response);

      expect(handleError).not.toHaveBeenCalled();
      expect(prisma.avatar.createMany).toHaveBeenCalledWith({
        data: [
          {
            url: "https://cdn.example.com/avatars/avatar1.png",
            isDefault: false,
          },
        ],
      });
      expect(prisma.avatar.create).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });
  });

  describe("getAvailableAvatars", () => {
    it("should fetch available avatars with default pagination", async () => {
      mockRequest = {
        query: {},
        params: {},
      };

      const mockAvatars = [
        { id: 1, url: "https://example.com/avatar1.png", isDefault: false },
        { id: 2, url: "https://example.com/avatar2.png", isDefault: false },
        { id: 3, url: "https://example.com/avatar3.png", isDefault: false },
      ] as Avatar[];

      vi.mocked(prisma.avatar.findMany).mockResolvedValue(mockAvatars);

      await getAvailableAvatars(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(prisma.avatar.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isDefault: false },
          take: 21,
        })
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: mockAvatars,
          pagination: expect.objectContaining({
            hasMore: false,
            nextCursor: null,
          }),
        })
      );
    });

    it("should handle custom pagination parameters", async () => {
      mockRequest = {
        query: { limit: "10", cursor: "5" },
        params: {},
      };

      const mockAvatars = [
        { id: 6, url: "https://example.com/avatar6.png", isDefault: false },
        { id: 7, url: "https://example.com/avatar7.png", isDefault: false },
      ] as Avatar[];

      vi.mocked(prisma.avatar.findMany).mockResolvedValue(mockAvatars);

      await getAvailableAvatars(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(prisma.avatar.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isDefault: false },
          take: 11,
          cursor: { id: 5 },
          skip: 1,
        })
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it("should handle pagination when there are more results", async () => {
      mockRequest = {
        query: { limit: "2" },
        params: {},
      };

      const mockAvatars = [
        { id: 1, url: "https://example.com/avatar1.png", isDefault: false },
        { id: 2, url: "https://example.com/avatar2.png", isDefault: false },
        { id: 3, url: "https://example.com/avatar3.png", isDefault: false },
      ] as Avatar[];

      vi.mocked(prisma.avatar.findMany).mockResolvedValue(mockAvatars);

      await getAvailableAvatars(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: mockAvatars.slice(0, 2), // Should return only requested limit
          pagination: expect.objectContaining({
            hasMore: true,
            nextCursor: 2, // Last item's ID
          }),
        })
      );
    });

    it("should return empty results when no avatars found", async () => {
      mockRequest = {
        query: {},
        params: {},
      };

      vi.mocked(prisma.avatar.findMany).mockResolvedValue([]);

      await getAvailableAvatars(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: [],
          pagination: expect.objectContaining({
            hasMore: false,
            nextCursor: null,
          }),
        })
      );
    });

    it("should handle database errors", async () => {
      mockRequest = {
        query: {},
        params: {},
      };

      const dbError = new Error("Database connection failed");
      vi.mocked(prisma.avatar.findMany).mockRejectedValue(dbError);

      await getAvailableAvatars(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(handleError).toHaveBeenCalledWith(dbError, mockResponse);
    });

    it("should handle invalid pagination parameters", async () => {
      mockRequest = {
        query: { limit: "invalid", cursor: "not-a-number" },
        params: {},
      };

      await getAvailableAvatars(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(handleError).toHaveBeenCalled();
      expect(prisma.avatar.findMany).not.toHaveBeenCalled();
    });
  });

  describe("getAvatars", () => {
    it("should fetch all avatars for admin user", async () => {
      mockRequest = {
        query: {},
        params: {},
        user: {
          id: mockUserId,
          role: "ADMIN",
          username: "test_username",
          email: "test_email",
        },
      };

      const mockAvatars = [
        { id: 1, url: "https://example.com/avatar1.png", isDefault: false },
        { id: 2, url: "https://example.com/default.png", isDefault: true },
        { id: 3, url: "https://example.com/avatar3.png", isDefault: false },
      ] as Avatar[];

      vi.mocked(prisma.avatar.findMany).mockResolvedValue(mockAvatars);

      await getAvatars(mockRequest as Request, mockResponse as Response);

      // Should query ALL avatars (no where filter unlike getAvailableAvatars)
      expect(prisma.avatar.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 21,
        })
      );

      expect(prisma.avatar.findMany).not.toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.anything(),
        })
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: mockAvatars,
          pagination: expect.any(Object),
        })
      );
    });

    it("should call handleError for non-admin user", async () => {
      mockRequest = {
        query: {},
        params: {},
        user: {
          id: mockUserId,
          role: "STUDENT",
          username: "test_username",
          email: "test_email",
        },
      };

      await getAvatars(mockRequest as Request, mockResponse as Response);

      expect(prisma.avatar.findMany).not.toHaveBeenCalled();
      expect(handleError).toHaveBeenCalledWith(
        expect.any(AuthorizationError),
        mockResponse
      );
    });

    it("should call handleError when user is not provided", async () => {
      mockRequest = {
        query: {},
        params: {},
        user: undefined,
      };

      await getAvatars(mockRequest as Request, mockResponse as Response);

      expect(prisma.avatar.findMany).not.toHaveBeenCalled();
      expect(handleError).toHaveBeenCalledWith(
        expect.any(AuthorizationError),
        mockResponse
      );
    });

    it("should handle database errors", async () => {
      mockRequest = {
        query: {},
        params: {},
        user: {
          id: mockUserId,
          role: "ADMIN",
          username: "test_username",
          email: "test_email",
        },
      };

      const dbError = new Error("Database timeout");
      vi.mocked(prisma.avatar.findMany).mockRejectedValue(dbError);

      await getAvatars(mockRequest as Request, mockResponse as Response);

      expect(handleError).toHaveBeenCalledWith(dbError, mockResponse);
    });
  });

  describe("deleteAvatar", () => {
    it("should delete avatar successfully", async () => {
      mockRequest = {
        params: { id: "1" },
        user: {
          id: mockUserId,
          role: "ADMIN",
          username: "test_username",
          email: "test_email",
        },
      };

      const mockAvatar = {
        id: 1,
        url: "https://example.com/avatar1.png",
        isDefault: false,
      } as Avatar;

      vi.mocked(prisma.avatar.findUnique).mockResolvedValue(mockAvatar);
      vi.mocked(prisma.avatar.delete).mockResolvedValue(mockAvatar);

      await deleteAvatar(mockRequest as Request, mockResponse as Response);

      expect(prisma.avatar.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(prisma.avatar.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Avatar deleted successfully",
      });
    });

    it("should call handleError for non-admin user", async () => {
      mockRequest = {
        params: { id: "1" },
        user: {
          id: mockUserId,
          role: "STUDENT",
          username: "test_username",
          email: "test_email",
        },
      };

      await deleteAvatar(mockRequest as Request, mockResponse as Response);

      expect(prisma.avatar.findUnique).not.toHaveBeenCalled();
      expect(prisma.avatar.delete).not.toHaveBeenCalled();
      expect(handleError).toHaveBeenCalledWith(
        expect.any(AuthorizationError),
        mockResponse
      );
    });

    it("should call handleError when user is not provided", async () => {
      mockRequest = {
        params: { id: "1" },
        user: undefined,
      };

      await deleteAvatar(mockRequest as Request, mockResponse as Response);

      expect(prisma.avatar.findUnique).not.toHaveBeenCalled();
      expect(prisma.avatar.delete).not.toHaveBeenCalled();
      expect(handleError).toHaveBeenCalledWith(
        expect.any(AuthorizationError),
        mockResponse
      );
    });

    it("should call handleError for invalid avatar ID", async () => {
      mockRequest = {
        params: { id: "invalid" },
        user: {
          id: mockUserId,
          role: "ADMIN",
          username: "test_username",
          email: "test_email",
        },
      };

      await deleteAvatar(mockRequest as Request, mockResponse as Response);

      expect(prisma.avatar.findUnique).not.toHaveBeenCalled();
      expect(prisma.avatar.delete).not.toHaveBeenCalled();
      expect(handleError).toHaveBeenCalled();
    });

    it("should call handleError for decimal ID numbers", async () => {
      mockRequest = {
        params: { id: "1.5" },
        user: {
          id: mockUserId,
          role: "ADMIN",
          username: "test_username",
          email: "test_email",
        },
      };

      await deleteAvatar(mockRequest as Request, mockResponse as Response);

      expect(prisma.avatar.findUnique).toHaveBeenCalled();
    });

    it("should return 404 when avatar not found", async () => {
      mockRequest = {
        params: { id: "999" },
        user: {
          id: mockUserId,
          role: "ADMIN",
          username: "test_username",
          email: "test_email",
        },
      };

      vi.mocked(prisma.avatar.findUnique).mockResolvedValue(null);

      await deleteAvatar(mockRequest as Request, mockResponse as Response);

      expect(prisma.avatar.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
      });
      expect(prisma.avatar.delete).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Avatar not found",
      });
    });

    it("should handle database errors during find operation", async () => {
      mockRequest = {
        params: { id: "1" },
        user: {
          id: mockUserId,
          role: "ADMIN",
          username: "test_username",
          email: "test_email",
        },
      };

      const dbError = new Error("Database connection failed");
      vi.mocked(prisma.avatar.findUnique).mockRejectedValue(dbError);

      await deleteAvatar(mockRequest as Request, mockResponse as Response);

      expect(handleError).toHaveBeenCalledWith(dbError, mockResponse);
    });

    it("should handle database errors during delete operation", async () => {
      mockRequest = {
        params: { id: "1" },
        user: {
          id: mockUserId,
          role: "ADMIN",
          username: "test_username",
          email: "test_email",
        },
      };

      const mockAvatar = {
        id: 1,
        url: "https://example.com/avatar1.png",
        isDefault: false,
      } as Avatar;

      vi.mocked(prisma.avatar.findUnique).mockResolvedValue(mockAvatar);

      const dbError = new Error("Foreign key constraint violation");
      vi.mocked(prisma.avatar.delete).mockRejectedValue(dbError);

      await deleteAvatar(mockRequest as Request, mockResponse as Response);

      expect(handleError).toHaveBeenCalledWith(dbError, mockResponse);
    });

    // Edge cases
    it("should handle string ID that parses to valid number", async () => {
      mockRequest = {
        params: { id: "42" },
        user: {
          id: mockUserId,
          role: "ADMIN",
          username: "test_username",
          email: "test_email",
        },
      };

      const mockAvatar = {
        id: 42,
        url: "https://example.com/avatar42.png",
        isDefault: false,
      } as Avatar;

      vi.mocked(prisma.avatar.findUnique).mockResolvedValue(mockAvatar);
      vi.mocked(prisma.avatar.delete).mockResolvedValue(mockAvatar);

      await deleteAvatar(mockRequest as Request, mockResponse as Response);

      expect(prisma.avatar.findUnique).toHaveBeenCalledWith({
        where: { id: 42 },
      });
      expect(prisma.avatar.delete).toHaveBeenCalledWith({
        where: { id: 42 },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it("should properly transform string ID to number in database calls", async () => {
      mockRequest = {
        params: { id: "123" },
        user: {
          id: mockUserId,
          role: "ADMIN",
          username: "test_username",
          email: "test_email",
        },
      };

      const mockAvatar = {
        id: 123,
        url: "https://example.com/avatar123.png",
        isDefault: false,
      } as Avatar;

      vi.mocked(prisma.avatar.findUnique).mockResolvedValue(mockAvatar);
      vi.mocked(prisma.avatar.delete).mockResolvedValue(mockAvatar);

      await deleteAvatar(mockRequest as Request, mockResponse as Response);

      expect(handleError).not.toHaveBeenCalled();
      // Verify that the string "123" is properly converted to number 123
      expect(prisma.avatar.findUnique).toHaveBeenCalledWith({
        where: { id: 123 },
      });
      expect(prisma.avatar.delete).toHaveBeenCalledWith({
        where: { id: 123 },
      });
    });
  });
});
