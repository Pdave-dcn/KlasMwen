import { Request, Response } from "express";
import { ZodError } from "zod";

import { updateTag } from "../../../controllers/tag.controller";
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

describe("updateTag controller", () => {
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
      mockRequest.body = { name: "TypeScript" };
      mockRequest.params = { id: "1" };
      mockRequest.user = createAuthenticatedUser({
        id: mockUserId,
        role: "STUDENT",
      });

      await updateTag(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).not.toHaveBeenCalled();
      expect(prisma.tag.update).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Unauthorized",
      });
    });

    it("should return 401 for unauthenticated user", async () => {
      mockRequest.body = { name: "TypeScript" };
      mockRequest.params = { id: "1" };
      mockRequest.user = undefined;

      await updateTag(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).not.toHaveBeenCalled();
      expect(prisma.tag.update).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Unauthorized",
      });
    });

    it("should allow ADMIN role to update tags", async () => {
      mockRequest.body = { name: "TypeScript" };
      mockRequest.params = { id: "1" };
      mockRequest.user = createAuthenticatedUser({
        id: mockUserId,
        role: "ADMIN",
      });

      vi.mocked(prisma.tag.findUnique).mockResolvedValue({
        id: 1,
        name: "javascript",
      });

      vi.mocked(prisma.tag.update).mockResolvedValue({
        id: 1,
        name: "typescript",
      });

      await updateTag(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe("Tag ID Validation Tests", () => {
    beforeEach(() => {
      mockRequest.user = createAuthenticatedUser({
        id: mockUserId,
        role: "ADMIN",
      });
      mockRequest.body = { name: "TypeScript" };
    });

    it("should return 400 when tag ID is missing", async () => {
      mockRequest.params = {};

      await updateTag(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).not.toHaveBeenCalled();
      expect(prisma.tag.update).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Tag ID is required",
      });
    });

    it("should return 400 for invalid tag ID (non-numeric)", async () => {
      mockRequest.params = { id: "abc" };

      await updateTag(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).not.toHaveBeenCalled();
      expect(prisma.tag.update).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Tag ID must be a valid positive integer",
      });
    });

    it("should return 400 for invalid tag ID (decimal)", async () => {
      mockRequest.params = { id: "1.5" };

      await updateTag(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).not.toHaveBeenCalled();
      expect(prisma.tag.update).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Tag ID must be a valid positive integer",
      });
    });

    it("should return 400 for negative tag ID", async () => {
      mockRequest.params = { id: "-5" };

      await updateTag(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).not.toHaveBeenCalled();
      expect(prisma.tag.update).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Tag ID must be a valid positive integer",
      });
    });

    it("should return 400 for zero tag ID", async () => {
      mockRequest.params = { id: "0" };

      await updateTag(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).not.toHaveBeenCalled();
      expect(prisma.tag.update).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Tag ID must be a valid positive integer",
      });
    });

    it("should return 400 for tag ID with special characters", async () => {
      mockRequest.params = { id: "123abc" };

      await updateTag(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).not.toHaveBeenCalled();
      expect(prisma.tag.update).not.toHaveBeenCalled();
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

      vi.mocked(prisma.tag.update).mockResolvedValue({
        id: 1,
        name: "typescript",
      });

      await updateTag(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it("should handle tag ID with whitespace", async () => {
      mockRequest.params = { id: " 42 " };

      vi.mocked(prisma.tag.findUnique).mockResolvedValue({
        id: 42,
        name: "javascript",
      });

      vi.mocked(prisma.tag.update).mockResolvedValue({
        id: 42,
        name: "typescript",
      });

      await updateTag(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).toHaveBeenCalledWith({
        where: { id: 42 },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it("should return 400 for empty string tag ID", async () => {
      mockRequest.params = { id: "" };

      await updateTag(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).not.toHaveBeenCalled();
      expect(prisma.tag.update).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 for whitespace-only tag ID", async () => {
      mockRequest.params = { id: "   " };

      await updateTag(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).not.toHaveBeenCalled();
      expect(prisma.tag.update).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });

  describe("Tag Existence Validation Tests", () => {
    beforeEach(() => {
      mockRequest.user = createAuthenticatedUser({
        id: mockUserId,
        role: "ADMIN",
      });
      mockRequest.body = { name: "TypeScript" };
    });

    it("should return 404 if tag is not found", async () => {
      mockRequest.params = { id: "999" };

      vi.mocked(prisma.tag.findUnique).mockResolvedValue(null);

      await updateTag(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
      });
      expect(prisma.tag.update).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Tag not found",
      });
    });

    it("should proceed with update if tag exists", async () => {
      mockRequest.params = { id: "1" };

      vi.mocked(prisma.tag.findUnique).mockResolvedValue({
        id: 1,
        name: "javascript",
      });

      vi.mocked(prisma.tag.update).mockResolvedValue({
        id: 1,
        name: "typescript",
      });

      await updateTag(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(prisma.tag.update).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe("Request Body Validation Tests", () => {
    beforeEach(() => {
      mockRequest.user = createAuthenticatedUser({
        id: mockUserId,
        role: "ADMIN",
      });
      mockRequest.params = { id: "1" };

      vi.mocked(prisma.tag.findUnique).mockResolvedValue({
        id: 1,
        name: "javascript",
      });
    });

    it("should handle invalid request body (missing name)", async () => {
      mockRequest.body = {};

      await updateTag(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalled();
      expect(prisma.tag.update).not.toHaveBeenCalled();
    });

    it("should handle invalid request body (invalid field)", async () => {
      mockRequest.body = { invalidField: "test" };

      await updateTag(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalled();
      expect(prisma.tag.update).not.toHaveBeenCalled();
    });

    it("should handle invalid request body (wrong type)", async () => {
      mockRequest.body = { name: 123 };

      await updateTag(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalled();
      expect(prisma.tag.update).not.toHaveBeenCalled();
    });

    it("should handle empty name string", async () => {
      mockRequest.body = { name: "" };

      await updateTag(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalled();
      expect(prisma.tag.update).not.toHaveBeenCalled();
    });

    it("should handle whitespace-only name", async () => {
      mockRequest.body = { name: "   " };

      await updateTag(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalled();
      expect(prisma.tag.update).not.toHaveBeenCalled();
    });

    it("should normalize tag name (lowercase)", async () => {
      mockRequest.body = { name: "TypeScript" };

      vi.mocked(prisma.tag.update).mockResolvedValue({
        id: 1,
        name: "typescript",
      });

      await updateTag(mockRequest, mockResponse);

      expect(prisma.tag.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: "typescript" },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it("should normalize tag name (trim whitespace)", async () => {
      mockRequest.body = { name: "  JavaScript  " };

      vi.mocked(prisma.tag.update).mockResolvedValue({
        id: 1,
        name: "javascript",
      });

      await updateTag(mockRequest, mockResponse);

      expect(prisma.tag.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: "javascript" },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe("Successful Update Tests", () => {
    beforeEach(() => {
      mockRequest.user = createAuthenticatedUser({
        id: mockUserId,
        role: "ADMIN",
      });
      mockRequest.params = { id: "1" };

      vi.mocked(prisma.tag.findUnique).mockResolvedValue({
        id: 1,
        name: "javascript",
      });
    });

    it("should update a tag successfully", async () => {
      mockRequest.body = { name: "TypeScript" };

      vi.mocked(prisma.tag.update).mockResolvedValue({
        id: 1,
        name: "typescript",
      });

      await updateTag(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(prisma.tag.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: "typescript" },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Tag updated successfully",
        data: { id: 1, name: "typescript" },
      });
    });

    it("should return updated tag data in response", async () => {
      mockRequest.body = { name: "React" };

      const updatedTag = {
        id: 1,
        name: "react",
      };

      vi.mocked(prisma.tag.update).mockResolvedValue(updatedTag);

      await updateTag(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Tag updated successfully",
        data: updatedTag,
      });
    });

    it("should handle updating tag with same name (idempotent)", async () => {
      mockRequest.body = { name: "javascript" };

      vi.mocked(prisma.tag.update).mockResolvedValue({
        id: 1,
        name: "javascript",
      });

      await updateTag(mockRequest, mockResponse);

      expect(prisma.tag.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: "javascript" },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe("Database Error Handling Tests", () => {
    beforeEach(() => {
      mockRequest.user = createAuthenticatedUser({
        id: mockUserId,
        role: "ADMIN",
      });
      mockRequest.params = { id: "1" };
      mockRequest.body = { name: "TypeScript" };
    });

    it("should handle database error during findUnique", async () => {
      const mockError = new Error("Database connection failed");
      vi.mocked(prisma.tag.findUnique).mockRejectedValue(mockError);

      await updateTag(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalledWith(mockError, mockResponse);
      expect(prisma.tag.update).not.toHaveBeenCalled();
    });

    it("should handle database error during update", async () => {
      vi.mocked(prisma.tag.findUnique).mockResolvedValue({
        id: 1,
        name: "javascript",
      });

      const mockError = new Error("Database update failed");
      vi.mocked(prisma.tag.update).mockRejectedValue(mockError);

      await updateTag(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalledWith(mockError, mockResponse);
    });

    it("should handle unique constraint violation", async () => {
      vi.mocked(prisma.tag.findUnique).mockResolvedValue({
        id: 1,
        name: "javascript",
      });

      const mockError = new Error("Unique constraint failed");
      (mockError as any).code = "P2002";
      vi.mocked(prisma.tag.update).mockRejectedValue(mockError);

      await updateTag(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalledWith(mockError, mockResponse);
    });

    it("should handle timeout error", async () => {
      vi.mocked(prisma.tag.findUnique).mockResolvedValue({
        id: 1,
        name: "javascript",
      });

      const mockError = new Error("Query timeout");
      vi.mocked(prisma.tag.update).mockRejectedValue(mockError);

      await updateTag(mockRequest, mockResponse);

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

    it("should handle very long tag name", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { name: "a".repeat(1000) };

      await updateTag(mockRequest, mockResponse);

      // Should be handled by schema validation or handleError
      expect(handleError).toHaveBeenCalled();
    });

    it("should handle special characters in tag name", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { name: "C++" };

      vi.mocked(prisma.tag.findUnique).mockResolvedValue({
        id: 1,
        name: "javascript",
      });

      vi.mocked(prisma.tag.update).mockResolvedValue({
        id: 1,
        name: "c++",
      });

      await updateTag(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalledWith(
        expect.any(ZodError),
        mockResponse
      );
    });

    it("should handle unicode characters in tag name", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { name: "日本語" };

      vi.mocked(prisma.tag.findUnique).mockResolvedValue({
        id: 1,
        name: "javascript",
      });

      vi.mocked(prisma.tag.update).mockResolvedValue({
        id: 1,
        name: "日本語",
      });

      await updateTag(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it("should handle very large valid tag ID", async () => {
      mockRequest.params = { id: "999999" };
      mockRequest.body = { name: "TypeScript" };

      vi.mocked(prisma.tag.findUnique).mockResolvedValue({
        id: 999999,
        name: "javascript",
      });

      vi.mocked(prisma.tag.update).mockResolvedValue({
        id: 999999,
        name: "typescript",
      });

      await updateTag(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).toHaveBeenCalledWith({
        where: { id: 999999 },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });
});
