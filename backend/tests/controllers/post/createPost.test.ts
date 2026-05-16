import { Request, Response } from "express";

import { createPost } from "../../../src/controllers/post/post.create.controller.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PostCreationFailedError } from "../../../src/core/error/custom/post.error.js";
import handleRequestValidation from "../../../src/features/posts/service/requestPostParser.js";

import { createAuthenticatedUser } from "./shared/helpers.js";
import { createMockRequest, createMockResponse } from "./shared/mocks.js";

const mockCreatePost = vi.fn();

vi.mock("../../../src/features/posts/service/PostService.js", () => ({
  postService: {
    command: {
      createPost: (...args: unknown[]) => mockCreatePost(...args),
    },
  },
}));

vi.mock("../../../src/features/posts/service/requestPostParser.js");

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

describe("createPost controller", () => {
  let mockReq: Request & { user?: unknown };
  let mockRes: Response;
  let mockNext: any;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  it("should create a text post and return 201", async () => {
    mockReq.user = createAuthenticatedUser({ id: "u1" });

    const mockValidatedData = {
      title: "Test Title",
      content: "Test Content",
      type: "NOTE" as const,
      tagIds: [],
    };
    const mockResult = {
      id: "p1",
      title: "Test Title",
      type: "NOTE" as const,
      tags: [],
    };
    const mockFileInfo = null;

    vi.mocked(handleRequestValidation).mockResolvedValue({
      completeValidatedData: mockValidatedData,
      uploadedFileInfo: mockFileInfo,
    });
    mockCreatePost.mockResolvedValue(mockResult);

    await createPost(mockReq, mockRes, mockNext);

    expect(handleRequestValidation).toHaveBeenCalledWith(mockReq, "u1");
    expect(mockCreatePost).toHaveBeenCalledWith(
      mockValidatedData,
      "u1",
      mockFileInfo,
    );
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: "Post created successfully",
      data: mockResult,
    });
  });

  it("should create a resource post with file and return 201", async () => {
    mockReq.user = createAuthenticatedUser({ id: "u1" });

    const mockValidatedData = {
      title: "Resource",
      type: "RESOURCE" as const,
      tagIds: [1],
    } as any;
    const mockFileInfo = {
      publicId: "cloud-id",
      secureUrl: "http://example.com/file.pdf",
    };
    const mockResult = {
      id: "p1",
      title: "Resource",
      type: "RESOURCE" as const,
      tags: [{ id: 1, name: "tag1" }],
    };

    vi.mocked(handleRequestValidation).mockResolvedValue({
      completeValidatedData: mockValidatedData,
      uploadedFileInfo: mockFileInfo,
    });
    mockCreatePost.mockResolvedValue(mockResult);

    await createPost(mockReq, mockRes, mockNext);

    expect(mockCreatePost).toHaveBeenCalledWith(
      mockValidatedData,
      "u1",
      mockFileInfo,
    );
    expect(mockRes.status).toHaveBeenCalledWith(201);
  });

  it("should return early when service returns falsy", async () => {
    mockReq.user = createAuthenticatedUser({ id: "u1" });

    vi.mocked(handleRequestValidation).mockResolvedValue({
      completeValidatedData: {
        title: "Test",
        type: "NOTE" as const,
        content: "Test Content",
        tagIds: [],
      },
      uploadedFileInfo: null,
    });
    mockCreatePost.mockResolvedValue(null);

    await createPost(mockReq, mockRes, mockNext);

    expect(mockCreatePost).toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });

  it("should call next when creation fails", async () => {
    mockReq.user = createAuthenticatedUser({ id: "u1" });

    vi.mocked(handleRequestValidation).mockResolvedValue({
      completeValidatedData: {
        title: "Test",
        type: "NOTE" as const,
        content: "Test Content",
        tagIds: [],
      },
      uploadedFileInfo: null,
    });
    mockCreatePost.mockRejectedValue(new PostCreationFailedError());

    await createPost(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(PostCreationFailedError));
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  it("should call next when request validation fails", async () => {
    mockReq.user = createAuthenticatedUser({ id: "u1" });

    const validationError = new Error("Invalid request");
    vi.mocked(handleRequestValidation).mockRejectedValue(validationError);

    await createPost(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(validationError);
    expect(mockCreatePost).not.toHaveBeenCalled();
  });

  it("should call next when user is not authenticated", async () => {
    await createPost(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockCreatePost).not.toHaveBeenCalled();
  });
});
