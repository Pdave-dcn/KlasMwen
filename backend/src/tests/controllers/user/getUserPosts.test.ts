import { Prisma } from "@prisma/client";

import { getUserPosts } from "../../../controllers/user/user.content.controller";
import prisma from "../../../core/config/db.js";
import { UserNotFoundError } from "../../../core/error/custom/user.error.js";
import { handleError } from "../../../core/error/index.js";

import { expectValidationError } from "./shared/helpers.js";
import {
  mockUser,
  createMockRequest,
  createMockResponse,
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
    bookmark: {
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

const mockPostId = "550e8400-e29b-41d4-a716-446655440000";
const mockPostId2 = "d4e5f678-9012-3456-7890-abcdef123456";

const mockPosts = [
  {
    id: mockPostId,
    title: "Test Title",
    content: "Test Content",
    type: "NOTE" as const,
    fileUrl: null,
    fileName: null,
    fileSize: null,
    mimeType: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    authorId: mockUser.id,
    postTags: [],
    comments: [],
    _count: {
      comments: 0,
      likes: 0,
    },
    hidden: false,
  },
  {
    id: mockPostId2,
    title: "Test Post 2",
    content: "Content of test post 2",
    type: "NOTE" as const,
    fileUrl: null,
    fileName: null,
    fileSize: null,
    mimeType: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    authorId: mockUser.id,
    postTags: [],
    _count: { comments: 0, likes: 3 },
    hidden: false,
  },
];

describe("getUserPosts controller", () => {
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
    it("should return user posts with default pagination", async () => {
      mockReq.params = { id: mockUser.id };
      mockReq.query = {};

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.post.findMany).mockResolvedValue(mockPosts);
      vi.mocked(prisma.post.count).mockResolvedValue(5);

      // Handling bookmark and like states
      vi.mocked(prisma.bookmark.findMany).mockResolvedValue([]);
      vi.mocked(prisma.like.findMany).mockResolvedValue([]);

      await getUserPosts(mockReq, mockRes);

      expect(handleError).not.toHaveBeenCalled();
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        select: { id: true },
      });

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([expect.any(Object)]),
          pagination: {
            hasMore: false,
            nextCursor: null,
            totalPosts: 5,
          },
        })
      );
    });

    it("should return empty posts array when user has no posts", async () => {
      mockReq.params = { id: mockUser.id };
      mockReq.query = {};

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.post.findMany).mockResolvedValue([]);

      await getUserPosts(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        data: [],
        pagination: {
          hasMore: false,
          nextCursor: null,
        },
      });
    });
  });

  describe("Validation Errors", () => {
    it("should handle invalid user ID format", async () => {
      await expectValidationError(getUserPosts, {
        params: { id: "invalid-uuid" },
      });
      expect(prisma.post.findMany).not.toHaveBeenCalled();
    });

    it("should handle missing user ID parameter", async () => {
      await expectValidationError(getUserPosts, {
        params: {},
      });
    });

    it("should handle invalid pagination parameters", async () => {
      await expectValidationError(getUserPosts, {
        params: { id: mockUser.id },
        query: { limit: "invalid", cursor: "not-a-uuid" },
      });
    });

    it("should handle negative limit values", async () => {
      await expectValidationError(getUserPosts, {
        params: { id: mockUser.id },
        query: { limit: "-5" },
      });
    });
  });

  describe("User Not Found Cases", () => {
    it("should call handleError when user does not exist", async () => {
      mockReq.params = { id: mockUser.id };
      mockReq.query = {};

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await getUserPosts(mockReq, mockRes);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        select: { id: true },
      });
      expect(handleError).toHaveBeenCalledWith(
        expect.any(UserNotFoundError),
        mockRes
      );
      expect(prisma.post.findMany).not.toHaveBeenCalled();
    });
  });

  describe("Database Errors", () => {
    it("should handle database connection errors during user lookup", async () => {
      mockReq.params = { id: mockUser.id };
      mockReq.query = {};

      const dbError = new Error("Database connection failed");
      vi.mocked(prisma.user.findUnique).mockRejectedValue(dbError);

      await getUserPosts(mockReq, mockRes);

      expect(handleError).toHaveBeenCalledWith(dbError, mockRes);
      expect(prisma.post.findMany).not.toHaveBeenCalled();
    });

    it("should handle database errors during posts fetch", async () => {
      mockReq.params = { id: mockUser.id };
      mockReq.query = {};

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      const dbError = new Error("Posts query failed");
      vi.mocked(prisma.post.findMany).mockRejectedValue(dbError);

      await getUserPosts(mockReq, mockRes);

      expect(handleError).toHaveBeenCalledWith(dbError, mockRes);
    });

    it("should handle Prisma known request errors", async () => {
      mockReq.params = { id: mockUser.id };
      mockReq.query = {};

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        "Database constraint violation",
        { code: "P2002", clientVersion: "5.0.0" }
      );
      vi.mocked(prisma.post.findMany).mockRejectedValue(prismaError);

      await getUserPosts(mockReq, mockRes);

      expect(handleError).toHaveBeenCalledWith(prismaError, mockRes);
    });

    it("should handle database timeout errors", async () => {
      mockReq.params = { id: mockUser.id };
      mockReq.query = {};

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      const timeoutError = new Error("Query timeout");
      vi.mocked(prisma.post.findMany).mockRejectedValue(timeoutError);

      await getUserPosts(mockReq, mockRes);

      expect(handleError).toHaveBeenCalledWith(timeoutError, mockRes);
    });
  });
});
