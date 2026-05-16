import { Request, Response } from "express";

import { getAllPosts } from "../../../src/controllers/post/post.fetch.controller";

import { createAuthenticatedUser } from "./shared/helpers";
import { createMockRequest, createMockResponse } from "./shared/mocks";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetAllPosts = vi.fn();

vi.mock("../../../src/features/posts/service/PostService.js", () => ({
  postService: {
    query: {
      getAllPosts: (...args: unknown[]) => mockGetAllPosts(...args),
    },
  },
}));

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

vi.mock("../../../src/core/error/index.js", () => ({
  handleError: vi.fn(),
}));

describe("getAllPosts", () => {
  let mockReq: Request & { user?: unknown };
  let mockRes: Response;
  let mockNext: any;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  it("should return paginated posts with 200", async () => {
    mockReq.user = createAuthenticatedUser({ id: "u1" });
    mockReq.query = { limit: "10" };

    const paginatedResult = {
      posts: [{ id: "p1", title: "Post 1" }],
      pagination: { nextCursor: null, hasMore: false },
    };
    mockGetAllPosts.mockResolvedValue(paginatedResult);

    await getAllPosts(mockReq, mockRes, mockNext);

    expect(mockGetAllPosts).toHaveBeenCalledWith("u1", 10, undefined);
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      data: paginatedResult.posts,
      pagination: paginatedResult.pagination,
    });
  });

  it("should pass cursor when provided", async () => {
    mockReq.user = createAuthenticatedUser({ id: "u1" });
    mockReq.query = {
      limit: "5",
      cursor: "550e8400-e29b-41d4-a716-446655440000",
    };

    mockGetAllPosts.mockResolvedValue({
      posts: [],
      pagination: { nextCursor: null, hasMore: false },
    });

    await getAllPosts(mockReq, mockRes, mockNext);

    expect(mockGetAllPosts).toHaveBeenCalledWith(
      "u1",
      5,
      "550e8400-e29b-41d4-a716-446655440000",
    );
  });

  it("should call next when service throws", async () => {
    mockReq.user = createAuthenticatedUser({ id: "u1" });
    mockReq.query = { limit: "10" };

    const error = new Error("DB error");
    mockGetAllPosts.mockRejectedValue(error);

    await getAllPosts(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(error);
    expect(mockRes.status).not.toHaveBeenCalled();
  });
});
