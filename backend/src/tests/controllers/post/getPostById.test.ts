import { Request, Response } from "express";

import { getPostById } from "../../../controllers/post/post.fetch.controller";
import prisma from "../../../core/config/db";
import { handleError } from "../../../core/error";
import { PostNotFoundError } from "../../../core/error/custom/post.error";

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

describe("getPostById", () => {
  let mockReq: Request;
  let mockRes: Response;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    vi.clearAllMocks();
  });

  it("should return a specific post", async () => {
    mockReq.user = createAuthenticatedUser();
    mockReq.params = { id: "60676309-9958-4a6a-b4bc-463199dab4ee" };

    const mockPost = {
      id: "postId-1",
      title: "Test",
      content: "Test content",
      type: "NOTE",
      fileUrl: null,
      fileName: null,
      fileSize: null,
      createdAt: new Date(),
      author: {
        id: "authorId-1",
        username: "testUser",
        Avatar: { id: 56, url: "mock-url-56.com" },
      },
      postTags: [],
      _count: { comments: 1, likes: 0 },
    };

    vi.mocked(prisma.post.findUnique).mockResolvedValue(mockPost as any);

    // For "isLiked" state in each post
    vi.mocked(prisma.like.findUnique).mockResolvedValue(null);
    // For "isBookmark" state in each post
    vi.mocked(prisma.bookmark.findUnique).mockResolvedValue(null);

    await getPostById(mockReq, mockRes);

    expect(handleError).not.toHaveBeenCalled();
    expect(prisma.post.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "60676309-9958-4a6a-b4bc-463199dab4ee" },
      })
    );

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalled();
  });

  it("should call handleError with PostNotFoundError if post is not found", async () => {
    mockReq.user = createAuthenticatedUser();
    mockReq.params = { id: "60676309-9958-4a6a-b4bc-463199dab4ee" };

    vi.mocked(prisma.post.findUnique).mockResolvedValue(null);

    await getPostById(mockReq, mockRes);

    expect(handleError).toHaveBeenCalledWith(
      expect.any(PostNotFoundError),
      mockRes
    );
  });
});
