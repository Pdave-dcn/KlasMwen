import { Request, Response } from "express";

import { getAllTags } from "../../../controllers/tag.controller";
import prisma from "../../../core/config/db";
import { handleError } from "../../../core/error";

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

describe("getAllTags controller", () => {
  let mockRequest: Request;
  let mockResponse: Response;

  const mockTags = [
    { id: 1, name: "javascript" },
    { id: 2, name: "react" },
    { id: 3, name: "nodejs" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    mockRequest = createMockRequest();
    mockResponse = createMockResponse();
  });

  describe("getAllTags", () => {
    it("should return tags", async () => {
      vi.mocked(prisma.tag.findMany).mockResolvedValue(mockTags);

      await getAllTags(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: mockTags,
      });
    });

    it("should handle empty tag list", async () => {
      vi.mocked(prisma.tag.findMany).mockResolvedValue([]);

      await getAllTags(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith({
        data: [],
      });
    });

    it("should handle database error", async () => {
      vi.mocked(prisma.tag.findMany).mockRejectedValue(
        new Error("Database connection failed")
      );

      await getAllTags(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalledWith(
        new Error("Database connection failed"),
        mockResponse
      );
    });
  });
});
