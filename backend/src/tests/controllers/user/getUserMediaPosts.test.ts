import { Prisma } from "@prisma/client";

import { getUserMediaPosts } from "../../../controllers/user.controller.js";
import prisma from "../../../core/config/db.js";
import { AuthenticationError } from "../../../core/error/custom/auth.error.js";
import { handleError } from "../../../core/error/index.js";

import {
  createAuthenticatedUser,
  expectValidationError,
} from "./shared/helpers.js";
import {
  createMockRequest,
  createMockResponse,
  mockUser,
} from "./shared/mocks.js";

import type { Request, Response } from "express";

// Prisma mocks
vi.mock("../../../core/config/db.js", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    post: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    like: {
      findMany: vi.fn(),
    },
    comment: {
      findMany: vi.fn(),
    },
  },
}));

// Logger mocks
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

// Error handler mocks
vi.mock("../../../core/error/index.js", () => ({
  handleError: vi.fn(),
}));

const mockPostId1 = "123e4567-e89b-12d3-a456-426614174001";
const mockPostId2 = "456e7890-e89b-12d3-a456-426614174002";
const mockPostId3 = "789e0123-e89b-12d3-a456-426614174003";

const mockMediaPosts = [
  {
    id: mockPostId1,
    title: "Test Post",
    content: null,
    authorId: {
      id: mockUser.id,
      username: mockUser.username,
      Avatar: {
        id: 1,
        url: "https://mock-avatar-url",
      },
    },
    type: "RESOURCE" as const,
    fileUrl: "https://mock-url.com",
    fileName: "mock-file-name",
    createdAt: new Date("2023-01-01T00:00:00Z"),
    postTags: [{ id: "tag-1", tag: { id: "tag-1", name: "test-tag" } }],
    _count: { comments: 5, likes: 10 },
  },
  {
    id: mockPostId2,
    title: "Test Post 2",
    content: null,
    authorId: {
      id: mockUser.id,
      username: mockUser.username,
      Avatar: {
        id: 2,
        url: "https://mock-avatar-url-2",
      },
    },
    type: "RESOURCE" as const,
    fileUrl: "https://mock-url-2.com",
    fileName: "mock-file-name-2",
    createdAt: new Date("2023-01-01T00:00:00Z"),
    postTags: [],
    _count: { comments: 0, likes: 5 },
  },
  {
    id: mockPostId3,
    title: "Test Post 3",
    content: null,
    authorId: {
      id: mockUser.id,
      username: mockUser.username,
      Avatar: {
        id: 3,
        url: "https://mock-avatar-url-3",
      },
    },
    type: "RESOURCE" as const,
    fileUrl: "https://mock-url-3.com",
    fileName: "mock-file-name-3",
    createdAt: new Date("2023-01-01T00:00:00Z"),
    postTags: [],
    _count: { comments: 2, likes: 5 },
  },
];

describe("getUserMediaPosts controller", () => {
  let mockReq: Request;
  let mockRes: Response;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("Success Cases", () => {
    it("should return user media posts with default pagination", async () => {
      mockReq.params = { id: mockUser.id };
      mockReq.query = {};

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      (prisma.post.findMany as any).mockResolvedValue(mockMediaPosts);

      await getUserMediaPosts(mockReq, mockRes);

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { authorId: mockUser.id, content: null },
        })
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.any(Array),
          pagination: expect.objectContaining({
            hasMore: expect.any(Boolean),
            nextCursor: null,
          }),
        })
      );

      const response = vi.mocked(mockRes.json).mock.calls[0][0];
      expect(response.data).toHaveLength(3);
      expect(response.data[0]).toMatchObject({
        id: expect.any(String),
        title: expect.any(String),
        type: expect.any(String),
        tags: expect.any(Array),
        _count: expect.any(Object),
      });
    });

    it("should return media posts with custom limit", async () => {
      mockReq.params = { id: mockUser.id };
      mockReq.query = { limit: "2" };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      (prisma.post.findMany as any).mockResolvedValue(mockMediaPosts);

      await getUserMediaPosts(mockReq, mockRes);

      expect(prisma.post.findMany).toHaveBeenCalled();

      const response = vi.mocked(mockRes.json).mock.calls[0][0];
      expect(response.data).toHaveLength(2);
      expect(response.pagination.hasMore).toBe(true);
      expect(response.pagination.nextCursor).toEqual(expect.any(String));
    });

    it("should return empty array when user has no media posts", async () => {
      mockReq.params = { id: mockUser.id };
      mockReq.query = {};

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.post.findMany).mockResolvedValue([]);

      await getUserMediaPosts(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);

      const response = vi.mocked(mockRes.json).mock.calls[0][0];
      expect(response.data).toEqual([]);
      expect(response.pagination.hasMore).toBe(false);
      expect(response.pagination.nextCursor).toBe(null);
    });
  });

  describe("Error Cases", () => {
    it("should return 404 when user does not exist", async () => {
      const nonExistentUserId = "123e4567-e89b-12d3-a456-426614174999";
      mockReq.params = { id: nonExistentUserId };
      mockReq.query = {};

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await getUserMediaPosts(mockReq, mockRes);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: nonExistentUserId },
        select: { id: true },
      });
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "User not found",
      });
      expect(prisma.post.findMany).not.toHaveBeenCalled();
    });

    it("should handle invalid user ID parameter", async () => {
      mockReq.params = { id: "invalid-uuid" };
      mockReq.query = {};

      await getUserMediaPosts(mockReq, mockRes);

      expect(handleError).toHaveBeenCalled();
      expect(prisma.post.findMany).not.toHaveBeenCalled();
    });

    it("should handle invalid limit parameter", async () => {
      mockReq.params = { id: mockUser.id };
      mockReq.query = { limit: "invalid" };

      await getUserMediaPosts(mockReq, mockRes);

      expect(handleError).toHaveBeenCalled();
      expect(prisma.post.findMany).not.toHaveBeenCalled();
    });

    it("should handle invalid cursor parameter", async () => {
      mockReq.params = { id: mockUser.id };
      mockReq.query = { cursor: "invalid-uuid" };

      await getUserMediaPosts(mockReq, mockRes);

      expect(handleError).toHaveBeenCalled();
      expect(prisma.post.findMany).not.toHaveBeenCalled();
    });

    it("should handle negative limit", async () => {
      mockReq.params = { id: mockUser.id };
      mockReq.query = { limit: "-5" };

      await getUserMediaPosts(mockReq, mockRes);

      expect(handleError).toHaveBeenCalled();
      expect(prisma.post.findMany).not.toHaveBeenCalled();
    });

    it("should handle zero limit", async () => {
      mockReq.params = { id: mockUser.id };
      mockReq.query = { limit: "0" };

      await getUserMediaPosts(mockReq, mockRes);

      expect(handleError).toHaveBeenCalled();
      expect(prisma.post.findMany).not.toHaveBeenCalled();
    });

    it("should handle database connection error during user check", async () => {
      mockReq.params = { id: mockUser.id };
      mockReq.query = {};

      const dbError = new Error("Database connection failed");
      vi.mocked(prisma.user.findUnique).mockRejectedValue(dbError);

      await getUserMediaPosts(mockReq, mockRes);

      expect(handleError).toHaveBeenCalledWith(dbError, mockRes);
      expect(prisma.post.findMany).not.toHaveBeenCalled();
    });

    it("should handle database error during posts fetch", async () => {
      mockReq.params = { id: mockUser.id };
      mockReq.query = {};

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      const dbError = new Error("Posts query failed");
      vi.mocked(prisma.post.findMany).mockRejectedValue(dbError);

      await getUserMediaPosts(mockReq, mockRes);

      expect(handleError).toHaveBeenCalledWith(dbError, mockRes);
    });

    it("should handle missing user ID parameter", async () => {
      mockReq.params = {};
      mockReq.query = {};

      await getUserMediaPosts(mockReq, mockRes);

      expect(handleError).toHaveBeenCalled();
      expect(prisma.post.findMany).not.toHaveBeenCalled();
    });
  });
});
