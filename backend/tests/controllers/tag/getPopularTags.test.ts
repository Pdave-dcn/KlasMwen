import { Request, Response } from "express";

import { getPopularTags } from "../../../src/controllers/tag.controller";
import prisma from "../../../src/core/config/db";
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
      findMany: vi.fn(),
    },
  },
}));

const MOCK_POPULAR_TAGS = [
  // Highest usage
  { id: 1, name: "react", _count: { postTags: 50 } },
  { id: 2, name: "typescript", _count: { postTags: 35 } },
  { id: 3, name: "javascript", _count: { postTags: 20 } },
  { id: 4, name: "node", _count: { postTags: 15 } },
  { id: 5, name: "express", _count: { postTags: 10 } },
  { id: 6, name: "python", _count: { postTags: 8 } },
  { id: 7, name: "css", _count: { postTags: 5 } },
  { id: 8, name: "html", _count: { postTags: 3 } },
  { id: 9, name: "sql", _count: { postTags: 2 } },
  { id: 10, name: "mongo", _count: { postTags: 1 } },
  // 11th tag, should be excluded by `take: 10`
  { id: 11, name: "misc", _count: { postTags: 0 } },
];

// Expected response data after mapping/formatting
const EXPECTED_FORMATTED_TAGS_10 = MOCK_POPULAR_TAGS.slice(0, 10).map(
  (tag) => ({
    id: tag.id,
    name: tag.name,
    usageCount: tag._count.postTags,
  })
);

describe("getPopularTags controller", () => {
  let mockRequest: Request;
  let mockResponse: Response;
  let mockNext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockNext = vi.fn();
    mockRequest = createMockRequest();
    mockResponse = createMockResponse();

    vi.mocked(prisma.tag.findMany).mockClear();
  });

  it("should call prisma.tag.findMany with correct parameters to fetch the top 10 tags", async () => {
    // Return more than 10 to ensure `take: 10` is used by the controller
    vi.mocked(prisma.tag.findMany).mockResolvedValue(
      MOCK_POPULAR_TAGS.slice(0, 10)
    );

    await getPopularTags(mockRequest, mockResponse, mockNext);

    expect(prisma.tag.findMany).toHaveBeenCalledWith({
      orderBy: {
        postTags: {
          _count: "desc",
        },
      },
      take: 10,
      select: {
        id: true,
        name: true,
        _count: {
          select: { postTags: true },
        },
      },
    });

    expect(mockResponse.status).toHaveBeenCalledWith(200);
  });

  it("should return the top 10 popular tags correctly formatted and ordered by usage count", async () => {
    // Return the top 10, correctly ordered (as per mock data setup)
    vi.mocked(prisma.tag.findMany).mockResolvedValue(
      MOCK_POPULAR_TAGS.slice(0, 10)
    );

    await getPopularTags(mockRequest, mockResponse, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: EXPECTED_FORMATTED_TAGS_10,
    });
    // Check ordering and mapping of the first and last element returned
    const returnedData = vi.mocked(mockResponse.json).mock.calls[0][0].data;
    expect(returnedData.length).toBe(10);
    expect(returnedData[0].name).toBe("react");
    expect(returnedData[0].usageCount).toBe(50);
    expect(returnedData[9].name).toBe("mongo");
    expect(returnedData[9].usageCount).toBe(1);
  });

  it("should return fewer than 10 tags if the total count is less than 10", async () => {
    const lessThan10 = MOCK_POPULAR_TAGS.slice(0, 3);
    const expected = EXPECTED_FORMATTED_TAGS_10.slice(0, 3);

    vi.mocked(prisma.tag.findMany).mockResolvedValue(lessThan10);

    await getPopularTags(mockRequest, mockResponse, mockNext);

    expect(prisma.tag.findMany).toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(vi.mocked(mockResponse.json).mock.calls[0][0].data.length).toBe(3);
    expect(mockResponse.json).toHaveBeenCalledWith({ data: expected });
  });

  it("should return an empty array if no tags are found", async () => {
    vi.mocked(prisma.tag.findMany).mockResolvedValue([]);

    await getPopularTags(mockRequest, mockResponse, mockNext);

    expect(prisma.tag.findMany).toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({ data: [] });
  });

  it("should correctly map the tag usage count even if the count is zero", async () => {
    const tagWithZeroUsage = [
      { id: 100, name: "unused", _count: { postTags: 0 } },
    ];

    vi.mocked(prisma.tag.findMany).mockResolvedValue(tagWithZeroUsage);

    await getPopularTags(mockRequest, mockResponse, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: [{ id: 100, name: "unused", usageCount: 0 }],
    });
  });

  it("should handle general database errors", async () => {
    const mockError = new Error("Prisma connection failure");
    vi.mocked(prisma.tag.findMany).mockRejectedValue(mockError);

    await getPopularTags(mockRequest, mockResponse, mockNext);

    expect(mockNext).toHaveBeenCalledWith(mockError);
    expect(mockResponse.status).not.toHaveBeenCalledWith(200); // Ensures successful response isn't called
  });
});
