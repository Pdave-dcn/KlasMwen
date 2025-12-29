import { Request, Response } from "express";

import { getAllPosts } from "../../../src/controllers/post/post.fetch.controller";
import prisma from "../../../src/core/config/db";
import { handleError } from "../../../src/core/error";

import { createAuthenticatedUser } from "./shared/helpers";
import { createMockRequest, createMockResponse } from "./shared/mocks";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

describe("getAllPosts", () => {
  let mockReq: Request;
  let mockRes: Response;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    vi.clearAllMocks();
  });

  it("should return a list of posts with default pagination", async () => {
    mockReq.user = createAuthenticatedUser();

    const mockPosts = [
      {
        id: "postId 1",
        title: "Post 1",
        content: "Content 1",
        type: "NOTE",
        fileUrl: null,
        fileName: null,
        createdAt: new Date(),
        author: {
          id: "60676309-9958-4a6a-b4bc-463199dab4ee",
          username: "testUser",
          Avatar: { id: 1, url: "https://mock-url.com-avatar.svg" },
        },
        postTags: [
          { postId: "postId 1", tagId: 1, tag: { id: 1, name: "tag1" } },
        ],
        _count: { comments: 0, likes: 0 },
      },
    ];

    vi.mocked(prisma.post.findMany).mockResolvedValue(mockPosts as any);

    // Handling bookmark and like states
    vi.mocked(prisma.bookmark.findMany).mockResolvedValue([]);
    vi.mocked(prisma.like.findMany).mockResolvedValue([]);

    await getAllPosts(mockReq, mockRes);

    expect(handleError).not.toHaveBeenCalled();
    expect(prisma.post.findMany).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([expect.any(Object)]),
        pagination: {
          hasMore: false,
          nextCursor: null,
        },
      })
    );
  });

  it("should handle custom pagination parameters", async () => {
    mockReq.user = createAuthenticatedUser();
    mockReq.query = { limit: "2" };
    const mockPosts = [
      {
        id: 6,
        title: "Post 6",
        content: "Content 6",
        type: "NOTE",
        fileUrl: null,
        fileName: null,
        createdAt: new Date(),
        author: {
          id: 1,
          username: "testUser",
          Avatar: { id: 2, url: "https://mock-url.com-avatar2.svg" },
        },
        postTags: [],
        _count: { comments: 0, likes: 0 },
      },
    ];

    vi.mocked(prisma.post.findMany).mockResolvedValue(mockPosts as any);

    // Handling bookmark and like states
    vi.mocked(prisma.bookmark.findMany).mockResolvedValue([]);
    vi.mocked(prisma.like.findMany).mockResolvedValue([]);

    await getAllPosts(mockReq, mockRes);

    expect(handleError).not.toHaveBeenCalled();
    expect(prisma.post.findMany).toHaveBeenCalled();

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([expect.any(Object)]),
        pagination: {
          hasMore: false,
          nextCursor: null,
        },
      })
    );
  });

  it("should call handleError if database query fails", async () => {
    mockReq.user = createAuthenticatedUser();
    const mockError = new Error("Database error");

    vi.mocked(prisma.post.findMany).mockRejectedValue(mockError);

    await getAllPosts(mockReq, mockRes);

    expect(handleError).toHaveBeenCalledWith(mockError, mockRes);
  });
});
