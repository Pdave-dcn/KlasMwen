import { Request, Response } from "express";

import { getPostById } from "../../../src/controllers/post/post.fetch.controller";
import { PostNotFoundError } from "../../../src/core/error/custom/post.error";

import { createAuthenticatedUser } from "./shared/helpers";
import { createMockRequest, createMockResponse } from "./shared/mocks";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetPostById = vi.fn();

vi.mock("../../../src/features/posts/service/PostService.js", () => ({
  postService: {
    query: {
      getPostById: (...args: unknown[]) => mockGetPostById(...args),
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

describe("getPostById", () => {
  let mockReq: Request & { user?: unknown };
  let mockRes: Response;
  let mockNext: any;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

  it("should return a specific post with 200", async () => {
    const userId = "u1";
    mockReq.user = createAuthenticatedUser({ id: userId });
    mockReq.params = { id: VALID_UUID };

    const mockPost = { id: VALID_UUID, title: "Test", type: "NOTE" };
    mockGetPostById.mockResolvedValue(mockPost);

    await getPostById(mockReq, mockRes, mockNext);

    expect(mockGetPostById).toHaveBeenCalledWith(VALID_UUID, userId);
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ data: mockPost });
  });

  it("should call next with PostNotFoundError if post is not found", async () => {
    mockReq.user = createAuthenticatedUser();
    mockReq.params = { id: VALID_UUID };

    mockGetPostById.mockRejectedValue(new PostNotFoundError(VALID_UUID));

    await getPostById(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(PostNotFoundError));
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  it("should call next when params validation fails", async () => {
    mockReq.user = createAuthenticatedUser();
    mockReq.params = { id: "bad-uuid" };

    await getPostById(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockGetPostById).not.toHaveBeenCalled();
  });
});
