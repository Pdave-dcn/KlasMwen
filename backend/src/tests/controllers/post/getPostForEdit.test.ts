import { PostType } from "@prisma/client";
import { Request, Response } from "express";

import { getPostForEdit } from "../../../controllers/post.controller";
import prisma from "../../../core/config/db";
import { handleError } from "../../../core/error";
import {
  AuthenticationError,
  AuthorizationError,
} from "../../../core/error/custom/auth.error";

import { createAuthenticatedUser } from "./shared/helpers";
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

vi.mock("../../../core/error/index.js", () => ({
  handleError: vi.fn(),
}));

vi.mock("../../../core/config/db.js", () => ({
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

  it("should call handleError with AuthenticationError when user is not authenticated", async () => {
    mockReq.params = { id: mockPostId };

    await getPostForEdit(mockReq, mockRes);

    expect(handleError).toHaveBeenCalledWith(
      expect.any(AuthenticationError),
      mockRes
    );
  });

  it("should return 404 if the post is not found", async () => {
    mockReq.user = createAuthenticatedUser();
    mockReq.params = { id: mockPostId };

    vi.mocked(prisma.post.findUnique).mockResolvedValue(null);

    await getPostForEdit(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({ message: "Post not found" });
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
