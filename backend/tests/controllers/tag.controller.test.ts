import { it, expect, describe, vi, beforeEach } from "vitest";

import { TagNotFoundError } from "../../src/core/error/custom/tag.error.js";
import {
  createTag,
  deleteTag,
  getAllTags,
  getPopularTags,
  getTagForEdit,
  updateTag,
} from "../../src/controllers/tag.controller.js";

const mockCreateTag = vi.fn();
const mockGetAllTags = vi.fn();
const mockGetTagForEdit = vi.fn();
const mockGetPopularTags = vi.fn();
const mockUpdateTag = vi.fn();
const mockDeleteTag = vi.fn();

vi.mock("../../src/features/tag/service/index.js", () => ({
  tagService: {
    createTag: (...args: unknown[]) => mockCreateTag(...args),
    getAllTags: (...args: unknown[]) => mockGetAllTags(...args),
    getTagForEdit: (...args: unknown[]) => mockGetTagForEdit(...args),
    getPopularTags: (...args: unknown[]) => mockGetPopularTags(...args),
    updateTag: (...args: unknown[]) => mockUpdateTag(...args),
    deleteTag: (...args: unknown[]) => mockDeleteTag(...args),
  },
}));

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
}));

type MockReq = Record<string, unknown>;
type MockRes = { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn> };
type MockNext = ReturnType<typeof vi.fn>;

function createReq(overrides: Record<string, unknown> = {}): MockReq {
  return {
    params: {},
    body: {},
    query: {},
    ...overrides,
  };
}

function createRes(): MockRes {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
}

describe("Tag Controller", () => {
  let mockRequest: MockReq;
  let mockResponse: MockRes;
  let mockNext: MockNext;

  beforeEach(() => {
    vi.clearAllMocks();
    mockResponse = createRes();
    mockNext = vi.fn();
  });

  describe("createTag", () => {
    it("should create a tag successfully", async () => {
      mockRequest = createReq({ body: { name: "javascript" } });
      const newTag = { id: 1, name: "javascript" };
      mockCreateTag.mockResolvedValue(newTag);

      await createTag(mockRequest as any, mockResponse as any, mockNext);

      expect(mockCreateTag).toHaveBeenCalledWith({ name: "javascript" });
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "New tag created successfully",
        data: newTag,
      });
    });

    it("should call next with validation error for invalid body", async () => {
      mockRequest = createReq({ body: { name: "" } });

      await createTag(mockRequest as any, mockResponse as any, mockNext);

      expect(mockCreateTag).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should handle service errors", async () => {
      const dbError = new Error("Database connection failed");
      mockRequest = createReq({ body: { name: "javascript" } });
      mockCreateTag.mockRejectedValue(dbError);

      await createTag(mockRequest as any, mockResponse as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(dbError);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe("getAllTags", () => {
    it("should return all tags", async () => {
      const tags = [
        { id: 1, name: "javascript" },
        { id: 2, name: "react" },
      ];
      mockGetAllTags.mockResolvedValue(tags);

      await getAllTags(mockRequest as any, mockResponse as any, mockNext);

      expect(mockGetAllTags).toHaveBeenCalledWith();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ data: tags });
    });

    it("should return empty array when no tags", async () => {
      mockGetAllTags.mockResolvedValue([]);

      await getAllTags(mockRequest as any, mockResponse as any, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith({ data: [] });
    });

    it("should handle service errors", async () => {
      const error = new Error("Database error");
      mockGetAllTags.mockRejectedValue(error);

      await getAllTags(mockRequest as any, mockResponse as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("getPopularTags", () => {
    it("should return popular tags", async () => {
      const tags = [
        { id: 1, name: "javascript", usageCount: 10 },
        { id: 2, name: "react", usageCount: 5 },
      ];
      mockGetPopularTags.mockResolvedValue(tags);

      await getPopularTags(mockRequest as any, mockResponse as any, mockNext);

      expect(mockGetPopularTags).toHaveBeenCalledWith(10);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ data: tags });
    });

    it("should handle service errors", async () => {
      const error = new Error("Database error");
      mockGetPopularTags.mockRejectedValue(error);

      await getPopularTags(mockRequest as any, mockResponse as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("getTagForEdit", () => {
    it("should return tag for editing", async () => {
      const tag = { id: 1, name: "javascript" };
      mockGetTagForEdit.mockResolvedValue(tag);
      mockRequest = createReq({ params: { id: "1" } });

      await getTagForEdit(mockRequest as any, mockResponse as any, mockNext);

      expect(mockGetTagForEdit).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ data: tag });
    });

    it("should call next with validation error for invalid id", async () => {
      mockRequest = createReq({ params: { id: "invalid" } });

      await getTagForEdit(mockRequest as any, mockResponse as any, mockNext);

      expect(mockGetTagForEdit).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it("should call next with TagNotFoundError when tag does not exist", async () => {
      mockRequest = createReq({ params: { id: "999" } });
      mockGetTagForEdit.mockRejectedValue(new TagNotFoundError(999));

      await getTagForEdit(mockRequest as any, mockResponse as any, mockNext);

      expect(mockGetTagForEdit).toHaveBeenCalledWith(999);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(TagNotFoundError));
    });

    it("should handle service errors", async () => {
      const error = new Error("Database error");
      mockGetTagForEdit.mockRejectedValue(error);
      mockRequest = createReq({ params: { id: "1" } });

      await getTagForEdit(mockRequest as any, mockResponse as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("updateTag", () => {
    it("should update a tag successfully", async () => {
      const updatedTag = { id: 1, name: "typescript" };
      mockUpdateTag.mockResolvedValue(updatedTag);
      mockRequest = createReq({
        params: { id: "1" },
        body: { name: "typescript" },
      });

      await updateTag(mockRequest as any, mockResponse as any, mockNext);

      expect(mockUpdateTag).toHaveBeenCalledWith(1, { name: "typescript" });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Tag updated successfully",
        data: updatedTag,
      });
    });

    it("should call next with validation error for invalid id", async () => {
      mockRequest = createReq({
        params: { id: "invalid" },
        body: { name: "typescript" },
      });

      await updateTag(mockRequest as any, mockResponse as any, mockNext);

      expect(mockUpdateTag).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it("should call next with validation error for invalid body", async () => {
      mockRequest = createReq({
        params: { id: "1" },
        body: { name: "" },
      });

      await updateTag(mockRequest as any, mockResponse as any, mockNext);

      expect(mockUpdateTag).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it("should call next with TagNotFoundError when tag does not exist", async () => {
      mockRequest = createReq({
        params: { id: "999" },
        body: { name: "typescript" },
      });
      mockUpdateTag.mockRejectedValue(new TagNotFoundError(999));

      await updateTag(mockRequest as any, mockResponse as any, mockNext);

      expect(mockUpdateTag).toHaveBeenCalledWith(999, { name: "typescript" });
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(TagNotFoundError));
    });

    it("should handle service errors", async () => {
      const error = new Error("Database error");
      mockUpdateTag.mockRejectedValue(error);
      mockRequest = createReq({
        params: { id: "1" },
        body: { name: "typescript" },
      });

      await updateTag(mockRequest as any, mockResponse as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("deleteTag", () => {
    it("should delete a tag successfully", async () => {
      mockDeleteTag.mockResolvedValue({ success: true });
      mockRequest = createReq({ params: { id: "1" } });

      await deleteTag(mockRequest as any, mockResponse as any, mockNext);

      expect(mockDeleteTag).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Tag deleted successfully",
      });
    });

    it("should call next with validation error for invalid id", async () => {
      mockRequest = createReq({ params: { id: "invalid" } });

      await deleteTag(mockRequest as any, mockResponse as any, mockNext);

      expect(mockDeleteTag).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it("should call next with TagNotFoundError when tag does not exist", async () => {
      mockRequest = createReq({ params: { id: "999" } });
      mockDeleteTag.mockRejectedValue(new TagNotFoundError(999));

      await deleteTag(mockRequest as any, mockResponse as any, mockNext);

      expect(mockDeleteTag).toHaveBeenCalledWith(999);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(TagNotFoundError));
    });

    it("should handle service errors", async () => {
      const error = new Error("Database error");
      mockDeleteTag.mockRejectedValue(error);
      mockRequest = createReq({ params: { id: "1" } });

      await deleteTag(mockRequest as any, mockResponse as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
