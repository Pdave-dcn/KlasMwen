import { Request, Response } from "express";
import { ZodError } from "zod";

import { getTagForEdit } from "../../../src/controllers/tag.controller";
import prisma from "../../../src/core/config/db";
import { handleError } from "../../../src/core/error";
import { AuthorizationError } from "../../../src/core/error/custom/auth.error";

import { createAuthenticatedUser } from "./shared/helpers";
import { createMockRequest, createMockResponse } from "./shared/mocks";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../src/core/config/logger.js", () => ({
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

vi.mock("../../../src/core/config/db.js", () => ({
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

vi.mock("../../../src/core/error/index.js");

describe("getTagForEdit controller", () => {
  let mockRequest: Request;
  let mockResponse: Response;

  const mockUserId = "c3d4e5f6-7890-1234-5678-90abcdef1234";

  beforeEach(() => {
    vi.clearAllMocks();

    mockRequest = createMockRequest();
    mockResponse = createMockResponse();
  });

  describe("Tag ID Validation Tests", () => {
    beforeEach(() => {
      mockRequest.user = createAuthenticatedUser({
        id: mockUserId,
        role: "ADMIN",
      });
    });

    it("should call handleError when tag ID is missing", async () => {
      mockRequest.params = {};

      await getTagForEdit(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).not.toHaveBeenCalled();
      expect(handleError).toHaveBeenCalledWith(
        expect.any(ZodError),
        mockResponse
      );
    });

    it("should call handleError for invalid tag ID (non-numeric)", async () => {
      mockRequest.params = { id: "abc" };

      await getTagForEdit(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).not.toHaveBeenCalled();
      expect(handleError).toHaveBeenCalledWith(
        expect.any(ZodError),
        mockResponse
      );
    });

    it("should call handleError for invalid tag ID (decimal)", async () => {
      mockRequest.params = { id: "1.5" };

      await getTagForEdit(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).not.toHaveBeenCalled();
      expect(handleError).toHaveBeenCalledWith(
        expect.any(ZodError),
        mockResponse
      );
    });

    it("should call handleError for negative tag ID", async () => {
      mockRequest.params = { id: "-5" };

      await getTagForEdit(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).not.toHaveBeenCalled();
      expect(handleError).toHaveBeenCalledWith(
        expect.any(ZodError),
        mockResponse
      );
    });

    it("should call handleError for zero tag ID", async () => {
      mockRequest.params = { id: "0" };

      await getTagForEdit(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).not.toHaveBeenCalled();
      expect(handleError).toHaveBeenCalledWith(
        expect.any(ZodError),
        mockResponse
      );
    });

    it("should call handleError for tag ID with special characters", async () => {
      mockRequest.params = { id: "123abc" };

      await getTagForEdit(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).not.toHaveBeenCalled();
      expect(handleError).toHaveBeenCalledWith(
        expect.any(ZodError),
        mockResponse
      );
    });

    it("should call handleError for tag ID with spaces", async () => {
      mockRequest.params = { id: "1 2 3" };

      await getTagForEdit(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).not.toHaveBeenCalled();
      expect(handleError).toHaveBeenCalledWith(
        expect.any(ZodError),
        mockResponse
      );
    });

    it("should handle tag ID with leading zeros", async () => {
      mockRequest.params = { id: "0001" };

      vi.mocked(prisma.tag.findUnique).mockResolvedValue({
        id: 1,
        name: "javascript",
      });

      await getTagForEdit(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it("should handle tag ID with leading/trailing whitespace", async () => {
      mockRequest.params = { id: " 42 " };

      vi.mocked(prisma.tag.findUnique).mockResolvedValue({
        id: 42,
        name: "javascript",
      });

      await getTagForEdit(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 42 },
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it("should call handleError for empty string tag ID", async () => {
      mockRequest.params = { id: "" };

      await getTagForEdit(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).not.toHaveBeenCalled();
      expect(handleError).toHaveBeenCalledWith(
        expect.any(ZodError),
        mockResponse
      );
    });

    it("should call handleError for whitespace-only tag ID", async () => {
      mockRequest.params = { id: "   " };

      await getTagForEdit(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).not.toHaveBeenCalled();
      expect(handleError).toHaveBeenCalledWith(
        expect.any(ZodError),
        mockResponse
      );
    });

    it("should call handleError for tag ID exceeding safe integer", async () => {
      mockRequest.params = { id: "9007199254740992" }; // Number.MAX_SAFE_INTEGER + 1

      await getTagForEdit(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).not.toHaveBeenCalled();
      expect(handleError).toHaveBeenCalledWith(
        expect.any(ZodError),
        mockResponse
      );
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

      expect(prisma.tag.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
        })
      );
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

      expect(prisma.tag.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 10 },
        })
      );
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

      expect(handleError).toHaveBeenCalledWith(expect.any(Error), mockResponse);
    });

    it("should handle network timeout error", async () => {
      const mockError = new Error("Network timeout");
      vi.mocked(prisma.tag.findUnique).mockRejectedValue(mockError);

      await getTagForEdit(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalledWith(expect.any(Error), mockResponse);
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

      expect(prisma.tag.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 999999 },
        })
      );
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

      expect(prisma.tag.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 123 },
        })
      );
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
