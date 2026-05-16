import { Request, Response } from "express";

import { updatePost } from "../../../src/controllers/post/post.update.controller";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  PostNotFoundError,
  PostUpdateFailedError,
} from "../../../src/core/error/custom/post.error";

import { createAuthenticatedUser } from "./shared/helpers";
import { createMockRequest, createMockResponse } from "./shared/mocks";

const mockUpdatePost = vi.fn();

vi.mock("../../../src/features/posts/service/PostService.js", () => ({
  postService: {
    command: {
      updatePost: (...args: unknown[]) => mockUpdatePost(...args),
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

describe("updatePost controller", () => {
  const VALID_UUID = "c377c8e9-d75d-4f16-9b57-1c64d2e8b2b7";

  let mockReq: Request & { user?: unknown };
  let mockRes: Response;
  let mockNext: any;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  it("should update a post and return 200", async () => {
    mockReq.user = createAuthenticatedUser({ id: "u1" });
    mockReq.params = { id: VALID_UUID };
    mockReq.body = {
      title: "Updated Title",
      content: "Updated Content",
      type: "NOTE",
      tagIds: [1, 2],
    };

    const mockResult = { id: VALID_UUID, title: "Updated Title" };
    mockUpdatePost.mockResolvedValue(mockResult);

    await updatePost(mockReq, mockRes, mockNext);

    expect(mockUpdatePost).toHaveBeenCalledTimes(1);
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: "Post updated successfully",
      data: mockResult,
    });
  });

  it("should update a resource post (only title) and return 200", async () => {
    mockReq.user = createAuthenticatedUser({ id: "u1" });
    mockReq.params = { id: VALID_UUID };
    mockReq.body = {
      title: "Updated Resource Title",
      type: "RESOURCE",
      tagIds: [],
      fileName: "file.pdf",
    };

    const mockResult = { id: VALID_UUID, title: "Updated Resource Title" };
    mockUpdatePost.mockResolvedValue(mockResult);

    await updatePost(mockReq, mockRes, mockNext);

    expect(mockUpdatePost).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  it("should return early when service returns falsy", async () => {
    mockReq.user = createAuthenticatedUser({ id: "u1" });
    mockReq.params = { id: VALID_UUID };
    mockReq.body = {
      title: "Post Title Here",
      type: "NOTE",
      tagIds: [],
      content: "This is valid content that is long enough",
    };

    mockUpdatePost.mockResolvedValue(null);

    await updatePost(mockReq, mockRes, mockNext);

    expect(mockUpdatePost).toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });

  it("should call next with error when service throws", async () => {
    mockReq.user = createAuthenticatedUser({ id: "u1" });
    mockReq.params = { id: VALID_UUID };
    mockReq.body = {
      title: "Post Title Here",
      type: "NOTE",
      tagIds: [],
      content: "This is valid content that is long enough",
    };

    const error = new PostUpdateFailedError(VALID_UUID);
    mockUpdatePost.mockRejectedValue(error);

    await updatePost(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(error);
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  it("should call next when post not found", async () => {
    mockReq.user = createAuthenticatedUser({ id: "u1" });
    mockReq.params = { id: VALID_UUID };
    mockReq.body = {
      title: "Post Title Here",
      type: "NOTE",
      tagIds: [],
      content: "This is valid content that is long enough",
    };

    mockUpdatePost.mockRejectedValue(new PostNotFoundError(VALID_UUID));

    await updatePost(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(PostNotFoundError));
  });

  it("should call next when params validation fails", async () => {
    mockReq.user = createAuthenticatedUser({ id: "u1" });
    mockReq.params = { id: "bad-uuid" };
    mockReq.body = { title: "Title", type: "NOTE", tagIds: [] };

    await updatePost(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockUpdatePost).not.toHaveBeenCalled();
  });

  it("should call next when body validation fails (missing title)", async () => {
    mockReq.user = createAuthenticatedUser({ id: "u1" });
    mockReq.params = { id: VALID_UUID };
    mockReq.body = { type: "NOTE", tagIds: [] };

    await updatePost(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockUpdatePost).not.toHaveBeenCalled();
  });

  it("should call next when body validation fails (missing type)", async () => {
    mockReq.user = createAuthenticatedUser({ id: "u1" });
    mockReq.params = { id: VALID_UUID };
    mockReq.body = { title: "Title", tagIds: [] };

    await updatePost(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockUpdatePost).not.toHaveBeenCalled();
  });

  it("should call next when body validation fails (empty title)", async () => {
    mockReq.user = createAuthenticatedUser({ id: "u1" });
    mockReq.params = { id: VALID_UUID };
    mockReq.body = { title: "", type: "NOTE", tagIds: [] };

    await updatePost(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it("should call next when body validation fails (invalid type)", async () => {
    mockReq.user = createAuthenticatedUser({ id: "u1" });
    mockReq.params = { id: VALID_UUID };
    mockReq.body = { title: "Title", type: "INVALID", tagIds: [] };

    await updatePost(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });
});
