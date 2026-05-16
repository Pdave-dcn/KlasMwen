import { Request, Response } from "express";

import { getPostForEdit } from "../../../src/controllers/post/post.fetch.controller";
import { PostNotFoundError } from "../../../src/core/error/custom/post.error";

import { createAuthenticatedUser } from "./shared/helpers";
import { createMockRequest, createMockResponse } from "./shared/mocks";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetPostForEdit = vi.fn();

vi.mock("../../../src/features/posts/service/PostService.js", () => ({
  postService: {
    command: {
      getPostForEdit: (...args: unknown[]) => mockGetPostForEdit(...args),
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

describe("getPostForEdit", () => {
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

  it("should return post for edit with 200", async () => {
    const user = createAuthenticatedUser({ id: "u1" });
    mockReq.user = user;
    mockReq.params = { id: VALID_UUID };

    const mockData = { id: VALID_UUID, title: "Edit me" };
    mockGetPostForEdit.mockResolvedValue(mockData);

    await getPostForEdit(mockReq, mockRes, mockNext);

    expect(mockGetPostForEdit).toHaveBeenCalledWith(user, VALID_UUID);
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ data: mockData });
  });

  it("should call next when post not found", async () => {
    mockReq.user = createAuthenticatedUser({ id: "u1" });
    mockReq.params = { id: VALID_UUID };

    mockGetPostForEdit.mockRejectedValue(new PostNotFoundError(VALID_UUID));

    await getPostForEdit(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(PostNotFoundError));
  });

  it("should call next when params validation fails", async () => {
    mockReq.user = createAuthenticatedUser({ id: "u1" });
    mockReq.params = { id: "bad-uuid" };

    await getPostForEdit(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockGetPostForEdit).not.toHaveBeenCalled();
  });
});
