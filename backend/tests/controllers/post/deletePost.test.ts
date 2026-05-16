import { Request, Response } from "express";

import { deletePost } from "../../../src/controllers/post/post.delete.controller";
import { PostNotFoundError } from "../../../src/core/error/custom/post.error";

import { createAuthenticatedUser } from "./shared/helpers";
import { createMockRequest, createMockResponse } from "./shared/mocks";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockDeletePost = vi.fn();

vi.mock("../../../src/features/posts/service/PostService.js", () => ({
  postService: {
    command: {
      deletePost: (...args: unknown[]) => mockDeletePost(...args),
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

describe("deletePost", () => {
  const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

  let mockReq: Request & { user?: unknown };
  let mockRes: Response;
  let mockNext: any;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  it("should delete a post and return 200", async () => {
    mockReq.user = createAuthenticatedUser({ id: "u1" });
    mockReq.params = { id: VALID_UUID };
    mockDeletePost.mockResolvedValue(undefined);

    await deletePost(mockReq, mockRes, mockNext);

    expect(mockDeletePost).toHaveBeenCalledWith(VALID_UUID, mockReq.user);
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: "Post deleted successfully",
    });
  });

  it("should call next with error when service throws", async () => {
    mockReq.user = createAuthenticatedUser({ id: "u1" });
    mockReq.params = { id: VALID_UUID };

    const error = new PostNotFoundError(VALID_UUID);
    mockDeletePost.mockRejectedValue(error);

    await deletePost(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(error);
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  it("should call next when params validation fails", async () => {
    mockReq.user = createAuthenticatedUser({ id: "u1" });
    mockReq.params = { id: "bad-uuid" };

    await deletePost(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockDeletePost).not.toHaveBeenCalled();
  });

  it("should pass user to service even when user is not authenticated", async () => {
    mockReq.params = { id: VALID_UUID };
    mockDeletePost.mockRejectedValue(new Error("auth required"));

    await deletePost(mockReq, mockRes, mockNext);

    expect(mockDeletePost).toHaveBeenCalledWith(VALID_UUID, undefined);
  });
});
