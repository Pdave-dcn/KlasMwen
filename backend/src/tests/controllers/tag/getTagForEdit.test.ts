import { Request, Response } from "express";

import { getTagForEdit } from "../../../controllers/tag.controller";
import prisma from "../../../core/config/db";
import { handleError } from "../../../core/error";

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

vi.mock("../../../core/config/db.js", () => ({
  default: {
    tag: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock("../../../core/error/index.js");

describe("getTagForEdit controller", () => {
  let mockRequest: Request;
  let mockResponse: Response;

  const mockUserId = "c3d4e5f6-7890-1234-5678-90abcdef1234";

  beforeEach(() => {
    vi.clearAllMocks();

    mockRequest = createMockRequest();
    mockResponse = createMockResponse();
  });

  describe("Authorization Tests", () => {
    it("should return 401 for non-admin user", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.user = createAuthenticatedUser({
        id: mockUserId,
        role: "STUDENT",
      });

      await getTagForEdit(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Unauthorized",
      });
    });

    it("should return 401 for unauthenticated user", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.user = undefined;

      await getTagForEdit(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Unauthorized",
      });
    });

    it("should return 401 for user with TEACHER role", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.user = createAuthenticatedUser({
        id: mockUserId,
        role: "TEACHER",
      });

      await getTagForEdit(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Unauthorized",
      });
    });

    it("should allow ADMIN role to fetch tag", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.user = createAuthenticatedUser({
        id: mockUserId,
        role: "ADMIN",
      });

      vi.mocked(prisma.tag.findUnique).mockResolvedValue({
        id: 1,
        name: "javascript",
      });

      await getTagForEdit(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe("Tag ID Validation Tests", () => {
    beforeEach(() => {
      mockRequest.user = createAuthenticatedUser({
        id: mockUserId,
        role: "ADMIN",
      });
    });

    it("should return 400 when tag ID is missing", async () => {
      mockRequest.params = {};

      await getTagForEdit(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Tag ID is required",
      });
    });

    it("should return 400 for invalid tag ID (non-numeric)", async () => {
      mockRequest.params = { id: "abc" };

      await getTagForEdit(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Tag ID must be a valid positive integer",
      });
    });

    it("should return 400 for invalid tag ID (decimal)", async () => {
      mockRequest.params = { id: "1.5" };

      await getTagForEdit(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Tag ID must be a valid positive integer",
      });
    });

    it("should return 400 for negative tag ID", async () => {
      mockRequest.params = { id: "-5" };

      await getTagForEdit(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Tag ID must be a valid positive integer",
      });
    });

    it("should return 400 for zero tag ID", async () => {
      mockRequest.params = { id: "0" };

      await getTagForEdit(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Tag ID must be a valid positive integer",
      });
    });

    it("should return 400 for tag ID with special characters", async () => {
      mockRequest.params = { id: "123abc" };

      await getTagForEdit(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Tag ID must be a valid positive integer",
      });
    });

    it("should return 400 for tag ID with spaces", async () => {
      mockRequest.params = { id: "1 2 3" };

      await getTagForEdit(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Tag ID must be a valid positive integer",
      });
    });

    it("should handle tag ID with leading zeros", async () => {
      mockRequest.params = { id: "0001" };

      vi.mocked(prisma.tag.findUnique).mockResolvedValue({
        id: 1,
        name: "javascript",
      });

      await getTagForEdit(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it("should handle tag ID with leading/trailing whitespace", async () => {
      mockRequest.params = { id: " 42 " };

      vi.mocked(prisma.tag.findUnique).mockResolvedValue({
        id: 42,
        name: "javascript",
      });

      await getTagForEdit(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).toHaveBeenCalledWith({
        where: { id: 42 },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it("should return 400 for empty string tag ID", async () => {
      mockRequest.params = { id: "" };

      await getTagForEdit(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 for whitespace-only tag ID", async () => {
      mockRequest.params = { id: "   " };

      await getTagForEdit(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 for tag ID exceeding safe integer", async () => {
      mockRequest.params = { id: "9007199254740992" }; // Number.MAX_SAFE_INTEGER + 1

      await getTagForEdit(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });

  describe("Tag Existence Validation Tests", () => {
    beforeEach(() => {
      mockRequest.user = createAuthenticatedUser({
        id: mockUserId,
        role: "ADMIN",
      });
    });

    it("should return 404 if tag is not found", async () => {
      mockRequest.params = { id: "999" };

      vi.mocked(prisma.tag.findUnique).mockResolvedValue(null);

      await getTagForEdit(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Tag not found",
      });
    });

    it("should handle tag not found after validation passes", async () => {
      mockRequest.params = { id: "1" };

      // First call during validation returns tag, second call returns null
      vi.mocked(prisma.tag.findUnique)
        .mockResolvedValueOnce({
          id: 1,
          name: "javascript",
        })
        .mockResolvedValueOnce(null);

      await getTagForEdit(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).toHaveBeenCalledTimes(2);
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Tag not found",
      });
    });

    it("should fetch tag if it exists", async () => {
      mockRequest.params = { id: "1" };

      const mockTag = {
        id: 1,
        name: "javascript",
      };

      vi.mocked(prisma.tag.findUnique).mockResolvedValue(mockTag);

      await getTagForEdit(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe("Successful Retrieval Tests", () => {
    beforeEach(() => {
      mockRequest.user = createAuthenticatedUser({
        id: mockUserId,
        role: "ADMIN",
      });
    });

    it("should return the correct tag element", async () => {
      mockRequest.params = { id: "1" };

      const mockTag = {
        id: 1,
        name: "javascript",
      };

      vi.mocked(prisma.tag.findUnique).mockResolvedValue(mockTag);

      await getTagForEdit(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: mockTag,
      });
    });

    it("should return tag with all properties intact", async () => {
      mockRequest.params = { id: "5" };

      const mockTag = {
        id: 5,
        name: "typescript",
      };

      vi.mocked(prisma.tag.findUnique).mockResolvedValue(mockTag);

      await getTagForEdit(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith({
        data: mockTag,
      });
    });

    it("should handle fetching different tags", async () => {
      mockRequest.params = { id: "10" };

      const mockTag = {
        id: 10,
        name: "react",
      };

      vi.mocked(prisma.tag.findUnique).mockResolvedValue(mockTag);

      await getTagForEdit(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).toHaveBeenCalledWith({
        where: { id: 10 },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: mockTag,
      });
    });

    it("should handle tags with special characters in name", async () => {
      mockRequest.params = { id: "1" };

      const mockTag = {
        id: 1,
        name: "c++",
      };

      vi.mocked(prisma.tag.findUnique).mockResolvedValue(mockTag);

      await getTagForEdit(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: mockTag,
      });
    });

    it("should handle tags with unicode characters", async () => {
      mockRequest.params = { id: "1" };

      const mockTag = {
        id: 1,
        name: "日本語",
      };

      vi.mocked(prisma.tag.findUnique).mockResolvedValue(mockTag);

      await getTagForEdit(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: mockTag,
      });
    });
  });

  describe("Database Error Handling Tests", () => {
    beforeEach(() => {
      mockRequest.user = createAuthenticatedUser({
        id: mockUserId,
        role: "ADMIN",
      });
      mockRequest.params = { id: "1" };
    });

    it("should handle general database error during validation", async () => {
      const mockError = new Error("Database connection failed");
      vi.mocked(prisma.tag.findUnique).mockRejectedValue(mockError);

      await getTagForEdit(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalledWith(mockError, mockResponse);
    });

    it("should handle database error during tag fetch", async () => {
      const mockError = new Error("Query timeout");

      // First call succeeds (validation), second fails (actual fetch)
      vi.mocked(prisma.tag.findUnique)
        .mockResolvedValueOnce({
          id: 1,
          name: "javascript",
        })
        .mockRejectedValueOnce(mockError);

      await getTagForEdit(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalledWith(mockError, mockResponse);
    });

    it("should handle network timeout error", async () => {
      const mockError = new Error("Network timeout");
      vi.mocked(prisma.tag.findUnique).mockRejectedValue(mockError);

      await getTagForEdit(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalledWith(mockError, mockResponse);
    });

    it("should handle database constraint error", async () => {
      const mockError = new Error("Foreign key constraint failed");
      (mockError as any).code = "P2003";
      vi.mocked(prisma.tag.findUnique).mockRejectedValue(mockError);

      await getTagForEdit(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalledWith(mockError, mockResponse);
    });

    it("should handle prisma client initialization error", async () => {
      const mockError = new Error("Prisma Client not initialized");
      vi.mocked(prisma.tag.findUnique).mockRejectedValue(mockError);

      await getTagForEdit(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalledWith(mockError, mockResponse);
    });
  });

  describe("Edge Cases", () => {
    beforeEach(() => {
      mockRequest.user = createAuthenticatedUser({
        id: mockUserId,
        role: "ADMIN",
      });
    });

    it("should handle very large valid tag ID", async () => {
      mockRequest.params = { id: "999999" };

      const mockTag = {
        id: 999999,
        name: "javascript",
      };

      vi.mocked(prisma.tag.findUnique).mockResolvedValue(mockTag);

      await getTagForEdit(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).toHaveBeenCalledWith({
        where: { id: 999999 },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it("should handle tag ID at boundary of safe integer", async () => {
      const safeIntId = "9007199254740991"; // Number.MAX_SAFE_INTEGER
      mockRequest.params = { id: safeIntId };

      const mockTag = {
        id: 9007199254740991,
        name: "javascript",
      };

      vi.mocked(prisma.tag.findUnique).mockResolvedValue(mockTag);

      await getTagForEdit(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it("should handle tag with empty string name (edge case from DB)", async () => {
      mockRequest.params = { id: "1" };

      const mockTag = {
        id: 1,
        name: "",
      };

      vi.mocked(prisma.tag.findUnique).mockResolvedValue(mockTag);

      await getTagForEdit(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: mockTag,
      });
    });

    it("should handle tag with very long name", async () => {
      mockRequest.params = { id: "1" };

      const mockTag = {
        id: 1,
        name: "a".repeat(1000),
      };

      vi.mocked(prisma.tag.findUnique).mockResolvedValue(mockTag);

      await getTagForEdit(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: mockTag,
      });
    });

    it("should handle concurrent requests for same tag", async () => {
      mockRequest.params = { id: "1" };

      const mockTag = {
        id: 1,
        name: "javascript",
      };

      vi.mocked(prisma.tag.findUnique).mockResolvedValue(mockTag);

      await Promise.all([
        getTagForEdit(mockRequest, mockResponse),
        getTagForEdit(mockRequest, mockResponse),
      ]);

      // Both should succeed independently
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe("Database Call Verification", () => {
    beforeEach(() => {
      mockRequest.user = createAuthenticatedUser({
        id: mockUserId,
        role: "ADMIN",
      });
    });

    it("should call findUnique with correct parameters", async () => {
      mockRequest.params = { id: "123" };

      vi.mocked(prisma.tag.findUnique).mockResolvedValue({
        id: 123,
        name: "javascript",
      });

      await getTagForEdit(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).toHaveBeenCalledWith({
        where: { id: 123 },
      });
    });

    it("should make two database calls (validation + fetch)", async () => {
      mockRequest.params = { id: "1" };

      vi.mocked(prisma.tag.findUnique).mockResolvedValue({
        id: 1,
        name: "javascript",
      });

      await getTagForEdit(mockRequest, mockResponse);

      // One call during validateTagOperation, one during actual fetch
      expect(prisma.tag.findUnique).toHaveBeenCalledTimes(2);
    });

    it("should not call findUnique if authorization fails", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.user = createAuthenticatedUser({
        id: mockUserId,
        role: "STUDENT",
      });

      await getTagForEdit(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).not.toHaveBeenCalled();
    });

    it("should not call findUnique if tag ID is invalid", async () => {
      mockRequest.params = { id: "invalid" };
      mockRequest.user = createAuthenticatedUser({
        id: mockUserId,
        role: "ADMIN",
      });

      await getTagForEdit(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).not.toHaveBeenCalled();
    });
  });
});
