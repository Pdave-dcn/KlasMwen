import { Readable, PassThrough } from "stream";

import axios from "axios";
import { Request, Response } from "express";

import { downloadResource } from "../../../src/controllers/post/post.fetch.controller";
import { PostNotFoundError } from "../../../src/core/error/custom/post.error";

import { createAuthenticatedUser } from "./shared/helpers";
import { createMockRequest, createMockResponse } from "./shared/mocks";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetResourcePostById = vi.fn();

vi.mock("../../../src/features/posts/service/PostService.js", () => ({
  postService: {
    query: {
      getResourcePostById: (...args: unknown[]) =>
        mockGetResourcePostById(...args),
    },
  },
}));

vi.mock("axios");

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

describe("downloadResource controller", () => {
  const VALID_UUID = "f34042c4-6143-4c8e-a790-49ba409529e8";

  const mockResourcePost = {
    id: VALID_UUID,
    title: "Test Resource",
    type: "RESOURCE" as const,
    fileUrl: "https://res.cloudinary.com/demo/testfile.pdf",
    fileName: "testfile.pdf",
    fileSize: 1024,
    mimeType: "application/pdf",
  };

  let mockReq: Request & { user?: unknown };
  let mockRes: Response;
  let mockNext: any;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockReq.on = vi.fn();
    mockRes = createMockResponse();
    mockRes.setHeader = vi.fn().mockReturnThis();
    (mockRes as any).headersSent = false;
    (mockRes as any).writableEnded = false;
    mockRes.destroy = vi.fn();
    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  it("should download a resource successfully with all headers", async () => {
    const mockStream = new Readable();
    mockStream.push("file content");
    mockStream.push(null);
    mockStream.pipe = vi
      .fn()
      .mockReturnValue(new PassThrough().on("end", () => {}));

    mockReq.user = createAuthenticatedUser();
    mockReq.params = { id: VALID_UUID };

    mockGetResourcePostById.mockResolvedValue(mockResourcePost);
    vi.mocked(axios).mockResolvedValue({
      data: mockStream,
      headers: {
        "content-length": "1024",
        "content-type": "application/pdf",
      },
    });

    await downloadResource(mockReq, mockRes, mockNext);

    expect(mockGetResourcePostById).toHaveBeenCalledWith(VALID_UUID);
    expect(mockRes.setHeader).toHaveBeenCalledWith(
      "Content-Disposition",
      'attachment; filename="testfile.pdf"',
    );
    expect(mockRes.setHeader).toHaveBeenCalledWith(
      "Content-Type",
      "application/pdf",
    );
    expect(mockRes.setHeader).toHaveBeenCalledWith("Content-Length", 1024);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should call next when post not found", async () => {
    mockReq.user = createAuthenticatedUser();
    mockReq.params = { id: VALID_UUID };

    mockGetResourcePostById.mockRejectedValue(
      new PostNotFoundError(VALID_UUID),
    );

    await downloadResource(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(PostNotFoundError));
  });

  it("should call next when post is not a resource post", async () => {
    mockReq.user = createAuthenticatedUser();
    mockReq.params = { id: VALID_UUID };

    mockGetResourcePostById.mockRejectedValue(
      new Error("Post is not a resource post"),
    );

    await downloadResource(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Post is not a resource post",
      }),
    );
  });

  it("should call next when params validation fails", async () => {
    mockReq.user = createAuthenticatedUser();
    mockReq.params = { id: "bad-uuid" };

    await downloadResource(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockGetResourcePostById).not.toHaveBeenCalled();
  });

  it("should use content-type from axios response when mimeType is null", async () => {
    const postWithoutMime = { ...mockResourcePost, mimeType: null };
    const mockStream = new Readable();
    mockStream.push("data");
    mockStream.push(null);
    mockStream.pipe = vi.fn().mockReturnValue(new PassThrough());

    mockReq.user = createAuthenticatedUser();
    mockReq.params = { id: VALID_UUID };

    mockGetResourcePostById.mockResolvedValue(postWithoutMime);
    vi.mocked(axios).mockResolvedValue({
      data: mockStream,
      headers: { "content-type": "application/octet-stream" },
    });

    await downloadResource(mockReq, mockRes, mockNext);

    expect(mockRes.setHeader).toHaveBeenCalledWith(
      "Content-Type",
      "application/octet-stream",
    );
  });

  it("should set filename to 'file' when fileName is null", async () => {
    const postWithoutName = { ...mockResourcePost, fileName: null };
    const mockStream = new Readable();
    mockStream.push("data");
    mockStream.push(null);
    mockStream.pipe = vi.fn().mockReturnValue(new PassThrough());

    mockReq.user = createAuthenticatedUser();
    mockReq.params = { id: VALID_UUID };

    mockGetResourcePostById.mockResolvedValue(postWithoutName);
    vi.mocked(axios).mockResolvedValue({
      data: mockStream,
      headers: {},
    });

    await downloadResource(mockReq, mockRes, mockNext);

    expect(mockRes.setHeader).toHaveBeenCalledWith(
      "Content-Disposition",
      'attachment; filename="file"',
    );
  });
});
