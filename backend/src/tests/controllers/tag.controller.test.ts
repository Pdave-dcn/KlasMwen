import { it, expect, describe, beforeEach, vi } from "vitest";

import {
  createTag,
  deleteTag,
  getAllTags,
  getTagForEdit,
  updateTag,
} from "../../controllers/tag.controller.js";
import prisma from "../../core/config/db.js";
import { handleError } from "../../core/error/index.js";

import type { Request, Response } from "express";

vi.mock("../../core/config/db.js", () => ({
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

vi.mock("../../core/error/index.js");

describe("Tag controller", () => {
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

  describe("createTag", () => {
    it("should create a new tag successfully", async () => {
      mockRequest = {
        body: { name: "JavaScript" },
        user: {
          id: mockUserId,
          role: "ADMIN",
          username: "test_username",
          email: "test_email",
        },
        params: {},
      };

      vi.mocked(prisma.tag.create).mockResolvedValue({
        id: 1,
        name: "javascript",
      });

      await createTag(mockRequest as Request, mockResponse as Response);

      expect(prisma.tag.create).toHaveBeenCalledWith({
        data: { name: "javascript" },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });

    it("should return 401 for none admin user", async () => {
      mockRequest = {
        body: { name: "JavaScript" },
        user: {
          id: mockUserId,
          role: "STUDENT",
          username: "test_username",
          email: "test_email",
        },
        params: {},
      };

      await createTag(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Unauthorized",
      });
      expect(prisma.tag.create).not.toHaveBeenCalled();
    });

    it("should handle invalid request body", async () => {
      mockRequest = {
        body: { invalidField: "test" },
        user: {
          id: mockUserId,
          role: "ADMIN",
          username: "test_username",
          email: "test_email",
        },
        params: {},
      };

      await createTag(mockRequest as Request, mockResponse as Response);

      expect(handleError).toHaveBeenCalled();
      expect(prisma.tag.create).not.toHaveBeenCalled();
    });

    it("should handle database unique constraint error", async () => {
      mockRequest = {
        body: { name: "JavaScript" },
        user: {
          id: mockUserId,
          role: "ADMIN",
          username: "test_username",
          email: "test_email",
        },
        params: {},
      };

      vi.mocked(prisma.tag.create).mockRejectedValue(
        new Error("Unique constraint failed")
      );

      await createTag(mockRequest as Request, mockResponse as Response);

      expect(handleError).toHaveBeenCalledWith(
        new Error("Unique constraint failed"),
        mockResponse
      );
    });

    it("should normalize tag name to lowercase", async () => {
      mockRequest = {
        body: { name: "JAVASCRIPT" },
        user: {
          id: mockUserId,
          role: "ADMIN",
          username: "test_username",
          email: "test_email",
        },
        params: {},
      };

      vi.mocked(prisma.tag.create).mockResolvedValue({
        id: 1,
        name: "javascript",
      });

      await createTag(mockRequest as Request, mockResponse as Response);

      expect(prisma.tag.create).toHaveBeenCalledWith({
        data: { name: "javascript" },
      });
    });

    it("should trim whitespace from tag name", async () => {
      mockRequest = {
        body: { name: "  JavaScript  " },
        user: {
          id: mockUserId,
          role: "ADMIN",
          username: "test_username",
          email: "test_email",
        },
        params: {},
      };

      vi.mocked(prisma.tag.create).mockResolvedValue({
        id: 1,
        name: "javascript",
      });

      await createTag(mockRequest as Request, mockResponse as Response);

      expect(prisma.tag.create).toHaveBeenCalledWith({
        data: { name: "javascript" },
      });
    });

    it("should return 401 for missing user", async () => {
      mockRequest = {
        body: { name: "JavaScript" },
        user: undefined,
        params: {},
      };

      await createTag(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Unauthorized",
      });
      expect(prisma.tag.create).not.toHaveBeenCalled();
    });

    it("should handle empty tag name", async () => {
      mockRequest = {
        body: { name: "" },
        user: {
          id: mockUserId,
          role: "ADMIN",
          username: "test_username",
          email: "test_email",
        },
        params: {},
      };

      await createTag(mockRequest as Request, mockResponse as Response);

      expect(handleError).toHaveBeenCalled();
      expect(prisma.tag.create).not.toHaveBeenCalled();
    });

    it("should handle general database error", async () => {
      mockRequest = {
        body: { name: "JavaScript" },
        user: {
          id: mockUserId,
          role: "ADMIN",
          username: "test_username",
          email: "test_email",
        },
        params: {},
      };

      vi.mocked(prisma.tag.create).mockRejectedValue(
        new Error("Database connection failed")
      );

      await createTag(mockRequest as Request, mockResponse as Response);

      expect(handleError).toHaveBeenCalledWith(
        new Error("Database connection failed"),
        mockResponse
      );
    });

    it("should handle mixed case and multiple spaces", async () => {
      mockRequest = {
        body: { name: "  JaVaScRiPt  ReAcT  " },
        user: {
          id: mockUserId,
          role: "ADMIN",
          username: "test_username",
          email: "test_email",
        },
        params: {},
      };

      vi.mocked(prisma.tag.create).mockResolvedValue({
        id: 1,
        name: "javascript react",
      });

      await createTag(mockRequest as Request, mockResponse as Response);

      expect(prisma.tag.create).toHaveBeenCalledWith({
        data: { name: "javascript react" },
      });
    });

    it("should return correct response structure on success", async () => {
      mockRequest = {
        body: { name: "JavaScript" },
        user: {
          id: mockUserId,
          role: "ADMIN",
          username: "test_username",
          email: "test_email",
        },
        params: {},
      };

      const mockTag = { id: 1, name: "javascript" };
      vi.mocked(prisma.tag.create).mockResolvedValue(mockTag);

      await createTag(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "New tag created successfully",
        data: mockTag,
      });
    });
  });

  describe("getAllTags", () => {
    it("should return first page with correct pagination metadata", async () => {
      mockRequest = {
        query: {
          limit: "3",
        },
      };

      const mockTags = [
        { id: 1, name: "javascript" },
        { id: 2, name: "react" },
        { id: 3, name: "nodejs" },
      ];

      vi.mocked(prisma.tag.findMany).mockResolvedValue([
        ...mockTags,
        { id: 4, name: "extra" },
      ]);
      vi.mocked(prisma.tag.count).mockResolvedValue(15);

      await getAllTags(mockRequest as Request, mockResponse as Response);

      expect(prisma.tag.findMany).toHaveBeenCalledWith({
        take: 4,
        orderBy: { name: "asc" },
      });
      expect(prisma.tag.count).toHaveBeenCalled();

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: mockTags,
        pagination: {
          nextCursor: 3,
          hasMore: true,
          totalCount: 15,
        },
      });
    });

    it("should return subsequent page when cursor is provided", async () => {
      mockRequest = {
        query: {
          limit: "3",
          cursor: "3",
          sortOrder: "desc",
        },
      };

      const mockTags = [
        { id: 4, name: "history" },
        { id: 5, name: "maths" },
        { id: 6, name: "physics" },
      ];

      vi.mocked(prisma.tag.findMany).mockResolvedValue([
        ...mockTags,
        { id: 7, name: "extra" },
      ]);
      vi.mocked(prisma.tag.count).mockResolvedValue(15);

      await getAllTags(mockRequest as Request, mockResponse as Response);

      expect(prisma.tag.findMany).toHaveBeenCalledWith({
        take: 4,
        cursor: { id: 3 },
        skip: 1,
        orderBy: { name: "desc" },
      });

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: mockTags,
        pagination: {
          nextCursor: 6,
          hasMore: true,
          totalCount: 15,
        },
      });
    });

    it("should call handleError when the cursor ID is an invalid format", async () => {
      mockRequest = {
        query: {
          limit: "3",
          cursor: "abc",
          sortOrder: "desc",
        },
      };

      await getAllTags(mockRequest as Request, mockResponse as Response);

      expect(handleError).toHaveBeenCalled();
      expect(prisma.tag.findMany).not.toHaveBeenCalledWith();
    });

    it("should return hasMore false when no more results exist", async () => {
      mockRequest = {
        query: { limit: "3" },
      };

      const mockTags = [
        { id: 1, name: "javascript" },
        { id: 2, name: "react" },
      ];

      vi.mocked(prisma.tag.findMany).mockResolvedValue(mockTags);
      vi.mocked(prisma.tag.count).mockResolvedValue(2);

      await getAllTags(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith({
        data: mockTags,
        pagination: {
          nextCursor: null,
          hasMore: false,
          totalCount: 2,
        },
      });
    });

    it("should handle empty tag list", async () => {
      mockRequest = {
        query: {},
      };

      vi.mocked(prisma.tag.findMany).mockResolvedValue([]);
      vi.mocked(prisma.tag.count).mockResolvedValue(0);

      await getAllTags(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith({
        data: [],
        pagination: {
          nextCursor: null,
          hasMore: false,
          totalCount: 0,
        },
      });
    });

    it("should use default limit and sort order when not provided", async () => {
      mockRequest = {
        query: {},
      };

      vi.mocked(prisma.tag.findMany).mockResolvedValue([]);
      vi.mocked(prisma.tag.count).mockResolvedValue(0);

      await getAllTags(mockRequest as Request, mockResponse as Response);

      expect(prisma.tag.findMany).toHaveBeenCalledWith({
        take: 21,
        orderBy: { name: "asc" },
      });
    });

    it("should handle database error", async () => {
      mockRequest = {
        query: { limit: "3" },
      };

      vi.mocked(prisma.tag.findMany).mockRejectedValue(
        new Error("Database connection failed")
      );

      await getAllTags(mockRequest as Request, mockResponse as Response);

      expect(handleError).toHaveBeenCalledWith(
        new Error("Database connection failed"),
        mockResponse
      );
    });

    it("should sort tags in ascending order when specified", async () => {
      mockRequest = {
        query: {
          limit: "2",
          sortOrder: "asc",
        },
        params: {},
      };

      const mockTags = [
        { id: 1, name: "apple" },
        { id: 2, name: "banana" },
      ];

      vi.mocked(prisma.tag.findMany).mockResolvedValue(mockTags);
      vi.mocked(prisma.tag.count).mockResolvedValue(2);

      await getAllTags(mockRequest as Request, mockResponse as Response);

      expect(prisma.tag.findMany).toHaveBeenCalledWith({
        take: 3,
        orderBy: { name: "asc" },
      });
    });
  });

  describe("getTagForEdit", () => {
    it("should return the correct tag element", async () => {
      mockRequest = {
        user: {
          id: mockUserId,
          role: "ADMIN",
          username: "test_username",
          email: "test_email",
        },
        params: { id: "1" },
      };

      vi.mocked(prisma.tag.findUnique)
        .mockResolvedValueOnce({
          id: 1,
          name: "javascript",
        })
        .mockResolvedValueOnce({ id: 1, name: "javascript" });

      await getTagForEdit(mockRequest as Request, mockResponse as Response);

      expect(prisma.tag.findUnique).toHaveBeenCalledTimes(2);
      expect(prisma.tag.findUnique).toHaveBeenNthCalledWith(1, {
        where: { id: 1 },
      });
      expect(prisma.tag.findUnique).toHaveBeenNthCalledWith(2, {
        where: { id: 1 },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: {
          id: 1,
          name: "javascript",
        },
      });
    });

    it("should return 404 if tag is not found", async () => {
      mockRequest = {
        user: {
          id: mockUserId,
          role: "ADMIN",
          username: "test_username",
          email: "test_email",
        },
        params: { id: "1" },
      };

      vi.mocked(prisma.tag.findUnique).mockResolvedValue(null);

      await getTagForEdit(mockRequest as Request, mockResponse as Response);

      expect(prisma.tag.findUnique).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Tag not found",
      });
    });

    it("should return 401 for none admin user", async () => {
      mockRequest = {
        user: {
          id: mockUserId,
          role: "STUDENT",
          username: "test_username",
          email: "test_email",
        },
        params: { id: "1" },
      };

      await getTagForEdit(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Unauthorized",
      });
      expect(prisma.tag.findUnique).not.toHaveBeenCalled();
    });

    it("should return 400 for invalid tag ID format", async () => {
      mockRequest = {
        user: {
          id: mockUserId,
          role: "ADMIN",
          username: "test_username",
          email: "test_email",
        },
        params: { id: "abc" },
      };

      await getTagForEdit(mockRequest as Request, mockResponse as Response);

      expect(prisma.tag.findUnique).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Tag ID must be a number",
      });
    });

    it("should handle general database error", async () => {
      mockRequest = {
        user: {
          id: mockUserId,
          role: "ADMIN",
          username: "test_username",
          email: "test_email",
        },
        params: { id: "1" },
      };

      const mockError = new Error("Database connection failed");
      vi.mocked(prisma.tag.findUnique).mockRejectedValue(mockError);

      await getTagForEdit(mockRequest as Request, mockResponse as Response);

      expect(handleError).toHaveBeenCalledWith(mockError, mockResponse);
    });
  });

  describe("updateTag", () => {
    it("should update a tag successfully", async () => {
      mockRequest = {
        user: {
          id: mockUserId,
          role: "ADMIN",
          username: "test_username",
          email: "test_email",
        },
        params: { id: "1" },
        body: { name: "TypeScript" },
      };

      vi.mocked(prisma.tag.findUnique).mockResolvedValue({
        id: 1,
        name: "javascript",
      });

      vi.mocked(prisma.tag.update).mockResolvedValue({
        id: 1,
        name: "typescript",
      });

      await updateTag(mockRequest as Request, mockResponse as Response);

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

    it("should return 401 for none admin user", async () => {
      mockRequest = {
        user: {
          id: mockUserId,
          role: "STUDENT",
          username: "test_username",
          email: "test_email",
        },
        params: { id: "1" },
        body: { name: "TypeScript" },
      };

      await updateTag(mockRequest as Request, mockResponse as Response);

      expect(prisma.tag.update).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Unauthorized",
      });
    });

    it("should return 404 if tag is not found", async () => {
      mockRequest = {
        user: {
          id: mockUserId,
          role: "ADMIN",
          username: "test_username",
          email: "test_email",
        },
        params: { id: "999" },
        body: { name: "TypeScript" },
      };

      vi.mocked(prisma.tag.findUnique).mockResolvedValueOnce(null);

      await updateTag(mockRequest as Request, mockResponse as Response);

      expect(prisma.tag.update).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Tag not found",
      });
    });

    it("should handle invalid request body", async () => {
      mockRequest = {
        user: {
          id: mockUserId,
          role: "ADMIN",
          username: "test_username",
          email: "test_email",
        },
        params: { id: "1" },
        body: { invalidField: "test" },
      };

      await updateTag(mockRequest as Request, mockResponse as Response);

      expect(handleError).toHaveBeenCalled();
      expect(prisma.tag.update).not.toHaveBeenCalled();
    });

    it("should handle general database error", async () => {
      mockRequest = {
        user: {
          id: mockUserId,
          role: "ADMIN",
          username: "test_username",
          email: "test_email",
        },
        params: { id: "1" },
        body: { name: "TypeScript" },
      };

      const mockError = new Error("Database update failed");
      vi.mocked(prisma.tag.update).mockRejectedValue(mockError);

      await updateTag(mockRequest as Request, mockResponse as Response);

      expect(handleError).toHaveBeenCalled();
    });
  });

  describe("deleteTag", () => {
    it("should delete a tag successfully", async () => {
      mockRequest = {
        user: {
          id: mockUserId,
          role: "ADMIN",
          username: "test_username",
          email: "test_email",
        },
        params: { id: "1" },
      };

      vi.mocked(prisma.tag.delete).mockResolvedValue({
        id: 1,
        name: "deleted",
      });

      await deleteTag(mockRequest as Request, mockResponse as Response);

      expect(prisma.tag.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Tag deleted successfully",
      });
    });

    it("should return 401 for none admin user", async () => {
      mockRequest = {
        user: {
          id: mockUserId,
          role: "STUDENT",
          username: "test_username",
          email: "test_email",
        },
        params: { id: "1" },
      };

      await deleteTag(mockRequest as Request, mockResponse as Response);

      expect(prisma.tag.delete).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Unauthorized",
      });
    });

    it("should return 404 if tag is not found", async () => {
      mockRequest = {
        user: {
          id: mockUserId,
          role: "ADMIN",
          username: "test_username",
          email: "test_email",
        },
        params: { id: "999" },
      };

      vi.mocked(prisma.tag.findUnique).mockResolvedValueOnce(null);

      await deleteTag(mockRequest as Request, mockResponse as Response);

      expect(prisma.tag.delete).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Tag not found",
      });
    });

    it("should handle general database error", async () => {
      mockRequest = {
        user: {
          id: mockUserId,
          role: "ADMIN",
          username: "test_username",
          email: "test_email",
        },
        params: { id: "1" },
      };

      const mockError = new Error("Database delete failed");
      vi.mocked(prisma.tag.delete).mockRejectedValue(mockError);

      await deleteTag(mockRequest as Request, mockResponse as Response);

      expect(handleError).toHaveBeenCalled();
    });
  });
});
