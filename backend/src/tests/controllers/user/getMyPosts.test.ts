import { Prisma } from "@prisma/client";

import { getMyPosts } from "../../../controllers/user.controller.js";
import prisma from "../../../core/config/db.js";
import { AuthenticationError } from "../../../core/error/custom/auth.error.js";
import { handleError } from "../../../core/error/index.js";

import { createAuthenticatedUser } from "./shared/helpers.js";
import { mockUser , createMockRequest, createMockResponse } from "./shared/mocks.js";

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

describe("getMyPosts controller", () => {
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

  const mockPosts = [
    {
      id: "123e4567-e89b-12d3-a456-426614174001",
      title: "Test Post",
      content: "Test content",
      authorId: mockUser.id,
      type: "NOTE",
      fileUrl: null,
      fileName: null,
      createdAt: new Date("2023-01-01T00:00:00Z"),
      postTags: [{ id: "tag-1", tag: { id: "tag-1", name: "test-tag" } }],
      _count: { comments: 5, likes: 10 },
    },
  ];

  describe("Success Cases", () => {
    it("should return user posts with pagination and total count", async () => {
      (prisma.post.findMany as any).mockResolvedValue(mockPosts);
      (prisma.post.count as any).mockResolvedValue(1);
      mockReq.user = createAuthenticatedUser();
      mockReq.query = { postLimit: "10", postCursor: undefined };

      await getMyPosts(mockReq, mockRes);

      expect(prisma.post.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.post.count).toHaveBeenCalledTimes(1);

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { authorId: mockUser.id } })
      );
      expect(prisma.post.count).toHaveBeenCalledWith({
        where: { authorId: mockUser.id },
      });

      expect(mockRes.json).toHaveBeenCalledWith({
        data: expect.any(Array),
        pagination: {
          hasMore: false,
          nextCursor: null,
          totalPosts: 1,
        },
      });
    });

    it("should return empty posts with a total count of 0", async () => {
      (prisma.post.findMany as any).mockResolvedValue([]);
      (prisma.post.count as any).mockResolvedValue(0);
      mockReq.user = createAuthenticatedUser();
      mockReq.query = { postLimit: "10", postCursor: undefined };

      await getMyPosts(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        data: [],

        pagination: {
          hasMore: false,
          nextCursor: null,
          totalPosts: 0,
        },
      });
    });
  });

  describe("Authentication Errors", () => {
    it("should handle missing user in request", async () => {
      mockReq.user = undefined;
      mockReq.query = {};

      await getMyPosts(mockReq, mockRes);

      expect(handleError).toHaveBeenCalledWith(
        expect.any(AuthenticationError),
        mockRes
      );
      expect(prisma.post.findMany).not.toHaveBeenCalled();
      expect(prisma.post.count).not.toHaveBeenCalled();
    });
  });

  describe("Database Errors", () => {
    it("should handle database connection errors", async () => {
      mockReq.user = createAuthenticatedUser();
      mockReq.query = {};
      const dbError = new Error("Database connection failed");

      (prisma.post.findMany as any).mockRejectedValue(dbError);
      (prisma.post.count as any).mockResolvedValue(0);

      await getMyPosts(mockReq, mockRes);

      expect(handleError).toHaveBeenCalledWith(dbError, mockRes);
    });

    it("should handle Prisma known request errors", async () => {
      mockReq.user = createAuthenticatedUser();
      mockReq.query = {};
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        "Database error",
        { code: "P2001", clientVersion: "5.0.0" }
      );

      (prisma.post.findMany as any).mockRejectedValue(prismaError);
      (prisma.post.count as any).mockResolvedValue(0);

      await getMyPosts(mockReq, mockRes);

      expect(handleError).toHaveBeenCalledWith(prismaError, mockRes);
    });
  });
});
