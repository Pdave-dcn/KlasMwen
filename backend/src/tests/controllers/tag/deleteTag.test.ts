import { Request, Response } from "express";

import { deleteTag } from "../../../controllers/tag.controller";
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

describe("deleteTag controller", () => {
  let mockRequest: Request;
  let mockResponse: Response;

  const mockUserId = "c3d4e5f6-7890-1234-5678-90abcdef1234";

  beforeEach(() => {
    vi.clearAllMocks();

    mockRequest = createMockRequest();
    mockResponse = createMockResponse();
  });

  describe("Success Cases", () => {
    it("should delete a tag successfully with valid admin user and tag ID", async () => {
      mockRequest.user = createAuthenticatedUser({
        id: mockUserId,
        role: "ADMIN",
      });
      mockRequest.params = { id: "1" };

      // Mock findUnique to return the tag (validation check)
      vi.mocked(prisma.tag.findUnique).mockResolvedValue({
        id: 1,
        name: "existing tag",
      });

      vi.mocked(prisma.tag.delete).mockResolvedValue({
        id: 1,
        name: "deleted",
      });

      await deleteTag(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(prisma.tag.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Tag deleted successfully",
      });
    });

    it("should delete a tag with string numeric ID", async () => {
      mockRequest.user = createAuthenticatedUser({
        id: mockUserId,
        role: "ADMIN",
      });
      mockRequest.params = { id: "123" };

      vi.mocked(prisma.tag.findUnique).mockResolvedValue({
        id: 123,
        name: "existing tag",
      });

      vi.mocked(prisma.tag.delete).mockResolvedValue({
        id: 123,
        name: "deleted tag",
      });

      await deleteTag(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).toHaveBeenCalledWith({
        where: { id: 123 },
      });
      expect(prisma.tag.delete).toHaveBeenCalledWith({
        where: { id: 123 },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe("Authentication & Authorization Error Cases", () => {
    it("should return 401 for unauthenticated user (no user object)", async () => {
      mockRequest.user = undefined;
      mockRequest.params = { id: "1" };

      await deleteTag(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).not.toHaveBeenCalled();
      expect(prisma.tag.delete).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });

    it("should return 401 for STUDENT role", async () => {
      mockRequest.user = createAuthenticatedUser({
        id: mockUserId,
        role: "STUDENT",
      });
      mockRequest.params = { id: "1" };

      await deleteTag(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).not.toHaveBeenCalled();
      expect(prisma.tag.delete).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Unauthorized",
      });
    });

    it("should return 401 for TEACHER role", async () => {
      mockRequest.user = createAuthenticatedUser({
        id: mockUserId,
        role: "TEACHER",
      });
      mockRequest.params = { id: "1" };

      await deleteTag(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).not.toHaveBeenCalled();
      expect(prisma.tag.delete).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });

    it("should return 401 for user with invalid/unknown role", async () => {
      mockRequest.user = createAuthenticatedUser({
        id: mockUserId,
        role: "INVALID_ROLE" as any,
      });
      mockRequest.params = { id: "1" };

      await deleteTag(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).not.toHaveBeenCalled();
      expect(prisma.tag.delete).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });
  });

  describe("Validation Error Cases", () => {
    it("should return 404 if tag is not found", async () => {
      mockRequest.user = createAuthenticatedUser({
        id: mockUserId,
        role: "ADMIN",
      });
      mockRequest.params = { id: "999" };

      vi.mocked(prisma.tag.findUnique).mockResolvedValue(null);

      await deleteTag(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
      });
      expect(prisma.tag.delete).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Tag not found",
      });
    });

    it("should return 400 for invalid tag ID format (non-numeric)", async () => {
      mockRequest.user = createAuthenticatedUser({
        id: mockUserId,
        role: "ADMIN",
      });
      mockRequest.params = { id: "invalid" };

      await deleteTag(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).not.toHaveBeenCalled();
      expect(prisma.tag.delete).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Tag ID must be a valid positive integer",
      });
    });

    it("should return 400 for missing tag ID parameter", async () => {
      mockRequest.user = createAuthenticatedUser({
        id: mockUserId,
        role: "ADMIN",
      });
      mockRequest.params = {};

      await deleteTag(mockRequest, mockResponse);

      // When params.id is undefined, parseTagId returns null
      expect(prisma.tag.findUnique).not.toHaveBeenCalled();
      expect(prisma.tag.delete).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it("should return 404 for negative tag ID", async () => {
      mockRequest.user = createAuthenticatedUser({
        id: mockUserId,
        role: "ADMIN",
      });
      mockRequest.params = { id: "-1" };

      await deleteTag(mockRequest, mockResponse);

      expect(prisma.tag.delete).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it("should return 404 for zero tag ID", async () => {
      mockRequest.user = createAuthenticatedUser({
        id: mockUserId,
        role: "ADMIN",
      });
      mockRequest.params = { id: "0" };

      await deleteTag(mockRequest, mockResponse);

      expect(prisma.tag.delete).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 for floating point tag ID", async () => {
      mockRequest.user = createAuthenticatedUser({
        id: mockUserId,
        role: "ADMIN",
      });
      mockRequest.params = { id: "1.5" };

      await deleteTag(mockRequest, mockResponse);

      expect(prisma.tag.findUnique).not.toHaveBeenCalled();
      expect(prisma.tag.delete).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });

  describe("Database Error Cases", () => {
    it("should handle general database error during deletion", async () => {
      mockRequest.user = createAuthenticatedUser({
        id: mockUserId,
        role: "ADMIN",
      });
      mockRequest.params = { id: "1" };

      vi.mocked(prisma.tag.findUnique).mockResolvedValue({
        id: 1,
        name: "existing tag",
      });

      const mockError = new Error("Database delete failed");
      vi.mocked(prisma.tag.delete).mockRejectedValue(mockError);

      await deleteTag(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalledWith(mockError, mockResponse);
    });

    it("should handle database connection error", async () => {
      mockRequest.user = createAuthenticatedUser({
        id: mockUserId,
        role: "ADMIN",
      });
      mockRequest.params = { id: "1" };

      vi.mocked(prisma.tag.findUnique).mockResolvedValue({
        id: 1,
        name: "existing tag",
      });

      const mockError = new Error("Connection to database failed");
      vi.mocked(prisma.tag.delete).mockRejectedValue(mockError);

      await deleteTag(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalledWith(mockError, mockResponse);
    });

    it("should handle foreign key constraint error", async () => {
      mockRequest.user = createAuthenticatedUser({
        id: mockUserId,
        role: "ADMIN",
      });
      mockRequest.params = { id: "1" };

      vi.mocked(prisma.tag.findUnique).mockResolvedValue({
        id: 1,
        name: "existing tag",
      });

      const mockError = new Error("Foreign key constraint failed");
      vi.mocked(prisma.tag.delete).mockRejectedValue(mockError);

      await deleteTag(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalledWith(mockError, mockResponse);
    });

    it("should handle timeout error during deletion", async () => {
      mockRequest.user = createAuthenticatedUser({
        id: mockUserId,
        role: "ADMIN",
      });
      mockRequest.params = { id: "1" };

      vi.mocked(prisma.tag.findUnique).mockResolvedValue({
        id: 1,
        name: "existing tag",
      });

      const mockError = new Error("Query timeout");
      vi.mocked(prisma.tag.delete).mockRejectedValue(mockError);

      await deleteTag(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalledWith(mockError, mockResponse);
    });

    it("should handle error during tag existence check", async () => {
      mockRequest.user = createAuthenticatedUser({
        id: mockUserId,
        role: "ADMIN",
      });
      mockRequest.params = { id: "1" };

      const mockError = new Error("Database query failed");
      vi.mocked(prisma.tag.findUnique).mockRejectedValue(mockError);

      await deleteTag(mockRequest, mockResponse);

      expect(prisma.tag.delete).not.toHaveBeenCalled();
      expect(handleError).toHaveBeenCalledWith(mockError, mockResponse);
    });
  });

  describe("Edge Cases", () => {
    it("should handle very large tag ID", async () => {
      mockRequest.user = createAuthenticatedUser({
        id: mockUserId,
        role: "ADMIN",
      });
      mockRequest.params = { id: "999999999" };

      vi.mocked(prisma.tag.findUnique).mockResolvedValue({
        id: 999999999,
        name: "large id tag",
      });

      vi.mocked(prisma.tag.delete).mockResolvedValue({
        id: 999999999,
        name: "large id tag",
      });

      await deleteTag(mockRequest, mockResponse);

      expect(prisma.tag.delete).toHaveBeenCalledWith({
        where: { id: 999999999 },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it("should handle tag ID with leading zeros", async () => {
      mockRequest.user = createAuthenticatedUser({
        id: mockUserId,
        role: "ADMIN",
      });
      mockRequest.params = { id: "0001" };

      vi.mocked(prisma.tag.findUnique).mockResolvedValue({
        id: 1,
        name: "tag",
      });

      vi.mocked(prisma.tag.delete).mockResolvedValue({
        id: 1,
        name: "tag",
      });

      await deleteTag(mockRequest, mockResponse);

      expect(prisma.tag.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it("should handle tag ID with whitespace", async () => {
      mockRequest.user = createAuthenticatedUser({
        id: mockUserId,
        role: "ADMIN",
      });
      mockRequest.params = { id: " 1 " };

      await deleteTag(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it("should handle empty string tag ID", async () => {
      mockRequest.user = createAuthenticatedUser({
        id: mockUserId,
        role: "ADMIN",
      });
      mockRequest.params = { id: "" };

      await deleteTag(mockRequest, mockResponse);

      expect(prisma.tag.delete).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it("should handle special characters in tag ID", async () => {
      mockRequest.user = createAuthenticatedUser({
        id: mockUserId,
        role: "ADMIN",
      });
      mockRequest.params = { id: "1@#$" };

      await deleteTag(mockRequest, mockResponse);

      expect(prisma.tag.delete).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });
});
