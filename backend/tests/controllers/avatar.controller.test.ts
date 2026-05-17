import { it, expect, describe, vi, beforeEach } from "vitest";

import { AvatarServiceError } from "../../src/core/error/custom/avatar.error.js";
import {
  addAvatar,
  addBatchAvatars,
  deleteAvatar,
  getAvailableAvatars,
  getAvatars,
} from "../../src/controllers/avatar.controller.js";

const mockGetAvatars = vi.fn();
const mockGetAvailableAvatars = vi.fn();
const mockCreateAvatar = vi.fn();
const mockCreateAvatars = vi.fn();
const mockDeleteAvatar = vi.fn();

vi.mock("../../src/features/avatar/service/index.js", () => ({
  avatarQueryService: {
    getAvatars: (...args: unknown[]) => mockGetAvatars(...args),
    getAvailableAvatars: (...args: unknown[]) =>
      mockGetAvailableAvatars(...args),
  },
  avatarCommandService: {
    createAvatar: (...args: unknown[]) => mockCreateAvatar(...args),
    createAvatars: (...args: unknown[]) => mockCreateAvatars(...args),
    deleteAvatar: (...args: unknown[]) => mockDeleteAvatar(...args),
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

describe("Avatar Controllers", () => {
  let mockRequest: MockReq;
  let mockResponse: MockRes;
  let mockNext: MockNext;

  beforeEach(() => {
    vi.clearAllMocks();
    mockResponse = createRes();
    mockNext = vi.fn();
  });

  describe("addAvatar", () => {
    it("should add a single avatar with isDefault defaulting to false", async () => {
      mockRequest = createReq({
        body: { url: "https://cdn.example.com/avatars/avatar1.png" },
      });

      const mockAvatarResult = {
        id: 1,
        url: "https://cdn.example.com/avatars/avatar1.png",
        isDefault: false,
      };

      mockCreateAvatar.mockResolvedValue(mockAvatarResult);

      await addAvatar(
        mockRequest as never,
        mockResponse as never,
        mockNext,
      );

      expect(mockCreateAvatar).toHaveBeenCalledWith({
        url: "https://cdn.example.com/avatars/avatar1.png",
        isDefault: undefined,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Avatar(s) added successfully",
        data: mockAvatarResult,
      });
    });

    it("should add a single avatar with explicit isDefault true", async () => {
      mockRequest = createReq({
        body: {
          url: "https://cdn.example.com/avatars/default-avatar.png",
          isDefault: true,
        },
      });

      const mockAvatarResult = {
        id: 2,
        url: "https://cdn.example.com/avatars/default-avatar.png",
        isDefault: true,
      };

      mockCreateAvatar.mockResolvedValue(mockAvatarResult);

      await addAvatar(
        mockRequest as never,
        mockResponse as never,
        mockNext,
      );

      expect(mockCreateAvatar).toHaveBeenCalledWith({
        url: "https://cdn.example.com/avatars/default-avatar.png",
        isDefault: true,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });

    it("should handle validation errors for invalid URL", async () => {
      mockRequest = createReq({
        body: { url: "invalid-url" },
      });

      await addAvatar(
        mockRequest as never,
        mockResponse as never,
        mockNext,
      );

      expect(mockCreateAvatar).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it("should forward database errors to next", async () => {
      mockRequest = createReq({
        body: { url: "https://cdn.example.com/avatars/avatar1.png" },
      });

      const dbError = new Error("Database connection failed");
      mockCreateAvatar.mockRejectedValue(dbError);

      await addAvatar(
        mockRequest as never,
        mockResponse as never,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(dbError);
    });
  });

  describe("addBatchAvatars", () => {
    it("should add multiple avatars successfully", async () => {
      mockRequest = createReq({
        body: [
          { url: "https://cdn.example.com/avatars/avatar1.png" },
          { url: "https://cdn.example.com/avatars/avatar2.png", isDefault: true },
          { url: "https://cdn.example.com/avatars/avatar3.png", isDefault: false },
        ],
      });

      const mockCreateManyResult = { count: 3 };
      mockCreateAvatars.mockResolvedValue(mockCreateManyResult);

      await addBatchAvatars(
        mockRequest as never,
        mockResponse as never,
        mockNext,
      );

      expect(mockCreateAvatars).toHaveBeenCalledWith([
        { url: "https://cdn.example.com/avatars/avatar1.png", isDefault: undefined },
        { url: "https://cdn.example.com/avatars/avatar2.png", isDefault: true },
        { url: "https://cdn.example.com/avatars/avatar3.png", isDefault: false },
      ]);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Avatar(s) added successfully",
        data: mockCreateManyResult,
      });
    });

    it("should handle validation error for empty array", async () => {
      mockRequest = createReq({ body: [] });

      await addBatchAvatars(
        mockRequest as never,
        mockResponse as never,
        mockNext,
      );

      expect(mockCreateAvatars).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it("should handle validation errors for invalid array item", async () => {
      mockRequest = createReq({
        body: [
          { url: "https://cdn.example.com/avatars/avatar1.png" },
          { url: "invalid-url" },
        ],
      });

      await addBatchAvatars(
        mockRequest as never,
        mockResponse as never,
        mockNext,
      );

      expect(mockCreateAvatars).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it("should forward database errors to next", async () => {
      mockRequest = createReq({
        body: [
          { url: "https://cdn.example.com/avatars/avatar1.png" },
          { url: "https://cdn.example.com/avatars/avatar2.png" },
        ],
      });

      const dbError = new Error("Database constraint violation");
      mockCreateAvatars.mockRejectedValue(dbError);

      await addBatchAvatars(
        mockRequest as never,
        mockResponse as never,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(dbError);
    });
  });

  describe("getAvailableAvatars", () => {
    it("should fetch available avatars with default pagination", async () => {
      mockRequest = createReq({ query: {} });

      const mockAvatars = {
        data: [
          { id: 1, url: "https://example.com/avatar1.png", isDefault: false },
          { id: 2, url: "https://example.com/avatar2.png", isDefault: false },
          { id: 3, url: "https://example.com/avatar3.png", isDefault: false },
        ],
        pagination: { hasMore: false, nextCursor: null },
      };

      mockGetAvailableAvatars.mockResolvedValue(mockAvatars);

      await getAvailableAvatars(
        mockRequest as never,
        mockResponse as never,
        mockNext,
      );

      expect(mockGetAvailableAvatars).toHaveBeenCalledWith(20, undefined);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockAvatars);
    });

    it("should handle custom pagination parameters", async () => {
      mockRequest = createReq({ query: { limit: "10", cursor: "5" } });

      const mockAvatars = {
        data: [
          { id: 6, url: "https://example.com/avatar6.png", isDefault: false },
          { id: 7, url: "https://example.com/avatar7.png", isDefault: false },
        ],
        pagination: { hasMore: false, nextCursor: null },
      };

      mockGetAvailableAvatars.mockResolvedValue(mockAvatars);

      await getAvailableAvatars(
        mockRequest as never,
        mockResponse as never,
        mockNext,
      );

      expect(mockGetAvailableAvatars).toHaveBeenCalledWith(10, 5);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it("should return empty results when no avatars found", async () => {
      mockRequest = createReq({ query: {} });

      const emptyResult = {
        data: [],
        pagination: { hasMore: false, nextCursor: null },
      };

      mockGetAvailableAvatars.mockResolvedValue(emptyResult);

      await getAvailableAvatars(
        mockRequest as never,
        mockResponse as never,
        mockNext,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(emptyResult);
    });

    it("should forward database errors to next", async () => {
      mockRequest = createReq({ query: {} });

      const dbError = new Error("Database connection failed");
      mockGetAvailableAvatars.mockRejectedValue(dbError);

      await getAvailableAvatars(
        mockRequest as never,
        mockResponse as never,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(dbError);
    });

    it("should handle invalid pagination parameters", async () => {
      mockRequest = createReq({ query: { limit: "invalid", cursor: "not-a-number" } });

      await getAvailableAvatars(
        mockRequest as never,
        mockResponse as never,
        mockNext,
      );

      expect(mockGetAvailableAvatars).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe("getAvatars", () => {
    it("should fetch all avatars", async () => {
      mockRequest = createReq({ query: {} });

      const mockAvatars = {
        data: [
          { id: 1, url: "https://example.com/avatar1.png", isDefault: false },
          { id: 2, url: "https://example.com/default.png", isDefault: true },
          { id: 3, url: "https://example.com/avatar3.png", isDefault: false },
        ],
        pagination: { hasMore: false, nextCursor: null },
      };

      mockGetAvatars.mockResolvedValue(mockAvatars);

      await getAvatars(
        mockRequest as never,
        mockResponse as never,
        mockNext,
      );

      expect(mockGetAvatars).toHaveBeenCalledWith(20, undefined);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockAvatars);
    });

    it("should forward database errors to next", async () => {
      mockRequest = createReq({ query: {} });

      const dbError = new Error("Database timeout");
      mockGetAvatars.mockRejectedValue(dbError);

      await getAvatars(
        mockRequest as never,
        mockResponse as never,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(dbError);
    });
  });

  describe("deleteAvatar", () => {
    it("should delete avatar successfully", async () => {
      mockRequest = createReq({ params: { id: "1" } });

      mockDeleteAvatar.mockResolvedValue(undefined);

      await deleteAvatar(
        mockRequest as never,
        mockResponse as never,
        mockNext,
      );

      expect(mockDeleteAvatar).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Avatar deleted successfully",
      });
    });

    it("should handle Zod validation errors for invalid ID", async () => {
      mockRequest = createReq({ params: { id: "invalid" } });

      await deleteAvatar(
        mockRequest as never,
        mockResponse as never,
        mockNext,
      );

      expect(mockDeleteAvatar).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it("should forward service errors to next", async () => {
      mockRequest = createReq({ params: { id: "999" } });

      const notFoundError = new AvatarServiceError("Avatar not found", 404);
      mockDeleteAvatar.mockRejectedValue(notFoundError);

      await deleteAvatar(
        mockRequest as never,
        mockResponse as never,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(notFoundError);
    });

    it("should forward database errors to next", async () => {
      mockRequest = createReq({ params: { id: "1" } });

      const dbError = new Error("Foreign key constraint violation");
      mockDeleteAvatar.mockRejectedValue(dbError);

      await deleteAvatar(
        mockRequest as never,
        mockResponse as never,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(dbError);
    });
  });
});
