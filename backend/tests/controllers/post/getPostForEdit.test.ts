import { PostType } from "@prisma/client";
import { Request, Response } from "express";

import { getPostForEdit } from "../../../src/controllers/post/post.fetch.controller";
import prisma from "../../../src/core/config/db";
import { handleError } from "../../../src/core/error";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  AuthenticationError,
  AuthorizationError,
} from "../../../src/core/error/custom/auth.error";
import { PostNotFoundError } from "../../../src/core/error/custom/post.error";

import { createAuthenticatedUser } from "./shared/helpers";
import { createMockRequest, createMockResponse } from "./shared/mocks";

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

vi.mock("../../../src/core/config/db.js", () => ({
  default: {
    post: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    bookmark: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    like: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe("getPostForEdit", () => {
  let mockReq: Request;
  let mockRes: Response;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    vi.clearAllMocks();
  });

  const mockPostId = "60676309-9958-4a6a-b4bc-463199dab4ee";
  const mockUserId = "f34042c4-6143-4c8e-a790-49ba409529e8";

  const mockPost = {
    id: mockPostId,
    title: "Test Post",
    content: "Content",
    hidden: false,
    type: "NOTE" as PostType,
    fileUrl: null,
    fileName: null,
    fileSize: null,
    mimeType: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    authorId: mockUserId,
    author: {
      // ← ADD THIS
      id: mockUserId,
      username: "testUser",
    },
    postTags: [{ postId: mockPostId, tagId: 2, tag: { id: 2, name: "tag1" } }],
    _count: { comments: 0, likes: 0 },
  };
  const mockEditResponse = {
    id: mockPostId,
    title: "Test Post",
    content: "Content",
    type: "NOTE" as PostType,
    tags: [{ id: 2, name: "tag1" }],
    hasFile: false as const,
  };

  it("should return post data for editing if the user is the author", async () => {
    mockReq.user = createAuthenticatedUser({ id: mockUserId });
    mockReq.params = { id: mockPostId };

    vi.mocked(prisma.post.findUnique).mockResolvedValue(mockPost);

    await getPostForEdit(mockReq, mockRes);

    expect(prisma.post.findUnique).toHaveBeenCalled();
    expect(handleError).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      data: mockEditResponse,
    });
  });

  it("should call handleError with PostNotFoundError if the post is not found", async () => {
    mockReq.user = createAuthenticatedUser();
    mockReq.params = { id: mockPostId };

    vi.mocked(prisma.post.findUnique).mockResolvedValue(null);

    await getPostForEdit(mockReq, mockRes);

    expect(handleError).toHaveBeenCalledWith(
      expect.any(PostNotFoundError),
      mockRes
    );
  });

  it("should call handleError with AuthorizationError if the user is not the author", async () => {
    mockReq.user = createAuthenticatedUser();
    mockReq.params = { id: mockPostId };

    vi.mocked(prisma.post.findUnique).mockResolvedValue(mockPost);

    await getPostForEdit(mockReq, mockRes);

    expect(handleError).toHaveBeenCalledWith(
      expect.any(AuthorizationError),
      mockRes
    );
  });

  it("should call handleError if a database query fails", async () => {
    mockReq.user = createAuthenticatedUser();
    mockReq.params = { id: mockPostId };

    const mockError = new Error("Database error");

    vi.mocked(prisma.post.findUnique).mockRejectedValue(mockError);

    await getPostForEdit(mockReq, mockRes);

    expect(handleError).toHaveBeenCalledWith(mockError, mockRes);
  });
});
