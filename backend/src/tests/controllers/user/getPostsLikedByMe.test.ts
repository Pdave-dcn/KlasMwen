import { Prisma } from "@prisma/client";

import { getPostsLikedByMe } from "../../../controllers/user.controller.js";
import prisma from "../../../core/config/db.js";
import { AuthenticationError } from "../../../core/error/custom/auth.error.js";
import { handleError } from "../../../core/error/index.js";

import {
  createAuthenticatedUser,
  expectValidationError,
} from "./shared/helpers.js";
import { createMockRequest, createMockResponse } from "./shared/mocks.js";

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

describe("getPostsLikedByMe controller", () => {
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
  const mockLikedPostId1 = "123e4567-e89b-12d3-a456-426614174001";
  const mockLikedPostId2 = "456e7890-e89b-12d3-a456-426614174002";
  const mockLikedPostId3 = "789e0123-e89b-12d3-a456-426614174003";

  const mockUserId1 = "e496794b-8f98-4f13-9d83-fc0c3b968f81";
  const mockUserId2 = "d4e5f678-9012-3456-7890-abcdef123456";

  const mockLikeWithPosts = [
    {
      userId: mockUserId1,
      postId: mockLikedPostId1,
      post: {
        id: mockLikedPostId1,
        title: "Liked Post 1",
        content: "Content of liked post 1",
        type: "NOTE" as const,
        fileUrl: null,
        fileName: null,
        createdAt: new Date("2023-01-01T00:00:00Z"),
        author: {
          id: mockUserId2,
          username: "otheruser",
          Avatar: {
            id: 1,
            url: "https://example.com/avatar1.jpg",
          },
        },
        postTags: [
          {
            id: 1,
            postId: mockLikedPostId1,
            tag: { id: "tag-1", name: "javascript" },
          },
        ],
        _count: { comments: 3, likes: 8 },
      },
    },
    {
      userId: mockUserId1,
      postId: mockLikedPostId2,
      post: {
        id: mockLikedPostId2,
        title: "Liked Post 2",
        content: null,
        type: "RESOURCE" as const,
        fileUrl: "https://example.com/resource.pdf",
        fileName: "resource.pdf",
        createdAt: new Date("2023-01-02T00:00:00Z"),
        author: {
          id: mockUserId2,
          username: "anotheruser",
          Avatar: null,
        },
        postTags: [],
        _count: { comments: 1, likes: 15 },
      },
    },
    {
      userId: mockUserId1,
      postId: mockLikedPostId3,
      post: {
        id: "789e0123-e89b-12d3-a456-426614174003",
        title: "Liked Post 3",
        content: "This is the third liked post",
        type: "NOTE" as const,
        fileUrl: null,
        fileName: null,
        createdAt: new Date("2023-01-03T00:00:00Z"),
        author: {
          id: mockUserId2,
          username: "thirduser",
          Avatar: {
            id: 3,
            url: "https://example.com/avatar3.jpg",
          },
        },
        postTags: [
          {
            id: 2,
            postId: mockLikedPostId3,
            tag: { id: 2, name: "typescript" },
          },
        ],
        _count: { comments: 2, likes: 5 },
      },
    },
  ];

  describe("Success Cases", () => {
    it("should return user liked posts with default pagination", async () => {
      mockReq.user = createAuthenticatedUser();
      mockReq.query = {};

      vi.mocked(prisma.like.findMany).mockResolvedValue(mockLikeWithPosts);

      // Handling bookmark state
      vi.mocked(prisma.bookmark.findMany).mockResolvedValue([]);

      await getPostsLikedByMe(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              title: expect.any(String),
              type: expect.any(String),
              createdAt: expect.any(Date),
              author: expect.any(Object),
              tags: expect.any(Array),
              _count: expect.any(Object),
            }),
          ]),
          pagination: {
            hasMore: false,
            nextCursor: null,
          },
        })
      );
    });

    it("should return user liked posts with custom pagination", async () => {
      mockReq.user = createAuthenticatedUser();
      mockReq.query = { limit: "2", cursor: mockLikedPostId1 };

      vi.mocked(prisma.like.findMany).mockResolvedValue(mockLikeWithPosts);

      // Handling bookmark state
      vi.mocked(prisma.bookmark.findMany).mockResolvedValue([]);

      await getPostsLikedByMe(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              title: expect.any(String),
              type: expect.any(String),
              createdAt: expect.any(Date),
              author: expect.any(Object),
              tags: expect.any(Array),
              _count: expect.any(Object),
            }),
          ]),
          pagination: {
            hasMore: true,
            nextCursor: mockLikedPostId2,
          },
        })
      );
    });

    it("should return empty array when user has no liked posts", async () => {
      mockReq.user = createAuthenticatedUser();
      mockReq.query = {};

      vi.mocked(prisma.like.findMany).mockResolvedValue([]);

      await getPostsLikedByMe(mockReq, mockRes);

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

  describe("Authentication Errors", () => {
    it("should handle missing user in request", async () => {
      mockReq.user = undefined;
      mockReq.query = {};

      await getPostsLikedByMe(mockReq, mockRes);

      expect(handleError).toHaveBeenCalledWith(
        expect.any(AuthenticationError),
        mockRes
      );
      expect(prisma.like.findMany).not.toHaveBeenCalled();
    });

    it("should handle undefined user in request", async () => {
      mockReq.user = undefined;
      mockReq.query = {};

      await getPostsLikedByMe(mockReq, mockRes);

      expect(handleError).toHaveBeenCalledWith(
        expect.any(AuthenticationError),
        mockRes
      );
      expect(prisma.like.findMany).not.toHaveBeenCalled();
    });
  });

  describe("Validation Errors", () => {
    it("should handle invalid pagination parameters", async () => {
      await expectValidationError(
        getPostsLikedByMe,
        {
          user: createAuthenticatedUser(),
          query: { limit: "invalid", cursor: "not-a-uuid" },
        },
        false
      );

      expect(prisma.like.findMany).not.toHaveBeenCalled();
    });

    it("should handle negative limit values", async () => {
      await expectValidationError(
        getPostsLikedByMe,
        {
          user: createAuthenticatedUser(),
          query: { limit: "-5" },
        },
        false
      );

      expect(prisma.like.findMany).not.toHaveBeenCalled();
    });

    it("should handle invalid cursor format", async () => {
      await expectValidationError(
        getPostsLikedByMe,
        {
          user: createAuthenticatedUser(),
          query: { limit: "10", cursor: "invalid-uuid-format" },
        },
        false
      );
      expect(prisma.like.findMany).not.toHaveBeenCalled();
    });

    it("should handle zero limit", async () => {
      await expectValidationError(
        getPostsLikedByMe,
        {
          user: createAuthenticatedUser(),
          query: { limit: "0" },
        },
        false
      );

      expect(prisma.like.findMany).not.toHaveBeenCalled();
    });
  });

  describe("Database/Service Errors", () => {
    it("should handle Prisma database connection errors", async () => {
      mockReq.user = createAuthenticatedUser();
      mockReq.query = {};

      const dbError = new Error("Database connection failed");
      vi.mocked(prisma.like.findMany).mockRejectedValue(dbError);

      await getPostsLikedByMe(mockReq, mockRes);

      expect(handleError).toHaveBeenCalledWith(dbError, mockRes);
      expect(prisma.like.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: mockReq.user.id },
        })
      );
    });

    it("should handle Prisma known request errors", async () => {
      mockReq.user = createAuthenticatedUser();
      mockReq.query = {};

      const prismaError = new Prisma.PrismaClientKnownRequestError(
        "Database constraint violation",
        { code: "P2002", clientVersion: "5.0.0" }
      );
      vi.mocked(prisma.like.findMany).mockRejectedValue(prismaError);

      await getPostsLikedByMe(mockReq, mockRes);

      expect(handleError).toHaveBeenCalledWith(prismaError, mockRes);
    });

    it("should handle database timeout errors", async () => {
      mockReq.user = createAuthenticatedUser();
      mockReq.query = {};

      const timeoutError = new Error("Query timeout");
      vi.mocked(prisma.like.findMany).mockRejectedValue(timeoutError);

      await getPostsLikedByMe(mockReq, mockRes);

      expect(handleError).toHaveBeenCalledWith(timeoutError, mockRes);
    });
  });

  describe("Edge Cases", () => {
    it("should handle malformed query parameters", async () => {
      mockReq.user = createAuthenticatedUser();
      mockReq.query = {
        limit: {},
        cursor: [],
      };

      await getPostsLikedByMe(mockReq, mockRes);

      expect(handleError).toHaveBeenCalled();
      expect(prisma.like.findMany).not.toHaveBeenCalled();
    });

    it("should handle empty string parameters", async () => {
      mockReq.user = createAuthenticatedUser();
      mockReq.query = { limit: "", cursor: "" };

      await getPostsLikedByMe(mockReq, mockRes);

      expect(handleError).toHaveBeenCalled();
      expect(prisma.like.findMany).not.toHaveBeenCalled();
    });

    it("should handle posts with missing author data", async () => {
      mockReq.user = createAuthenticatedUser();
      mockReq.query = {};

      const likesWithMissingAuthor = [
        {
          userId: mockUserId1,
          postId: mockLikedPostId1,
          post: {
            id: mockLikedPostId1,
            title: "Post with missing author",
            content: "Content",
            type: "NOTE" as const,
            fileUrl: null,
            fileName: null,
            createdAt: new Date("2023-01-01T00:00:00Z"),
            author: null, // Missing author
            postTags: [],
            _count: { comments: 0, likes: 1 },
          },
        },
      ];

      vi.mocked(prisma.like.findMany).mockResolvedValue(likesWithMissingAuthor);

      // Handling bookmark state
      vi.mocked(prisma.bookmark.findMany).mockResolvedValue([]);

      await getPostsLikedByMe(mockReq, mockRes);

      expect(handleError).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({
              id: mockLikedPostId1,
              author: null,
            }),
          ]),
        })
      );
    });

    it("should handle posts with empty tag arrays", async () => {
      mockReq.user = createAuthenticatedUser();
      mockReq.query = {};

      const likesWithNoTags = [
        {
          userId: mockUserId1,
          postId: mockLikedPostId1,
          post: {
            id: mockLikedPostId1,
            title: "Post with no tags",
            content: "Content",
            type: "NOTE" as const,
            fileUrl: null,
            fileName: null,
            createdAt: new Date("2023-01-01T00:00:00Z"),
            author: {
              id: mockUserId2,
              username: "testuser",
              Avatar: null,
            },
            postTags: [], // No tags
            _count: { comments: 0, likes: 1 },
          },
        },
      ];

      vi.mocked(prisma.like.findMany).mockResolvedValue(likesWithNoTags);

      // Handling bookmark state
      vi.mocked(prisma.bookmark.findMany).mockResolvedValue([]);

      await getPostsLikedByMe(mockReq, mockRes);

      expect(handleError).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({
              id: mockLikedPostId1,
              tags: [],
            }),
          ]),
        })
      );
    });
  });

  describe("Performance and Behavior", () => {
    it("should handle concurrent requests properly", async () => {
      mockReq.user = createAuthenticatedUser();
      mockReq.query = {};

      vi.mocked(prisma.like.findMany).mockResolvedValue([]);

      const promise1 = getPostsLikedByMe(mockReq, mockRes);
      const promise2 = getPostsLikedByMe(mockReq, mockRes);

      await Promise.all([promise1, promise2]);

      expect(prisma.like.findMany).toHaveBeenCalledTimes(2);
    });

    it("should properly transform post data through the service layer", async () => {
      mockReq.user = createAuthenticatedUser();
      mockReq.query = {};

      vi.mocked(prisma.like.findMany).mockResolvedValue(mockLikeWithPosts);

      // Handling bookmark state
      vi.mocked(prisma.bookmark.findMany).mockResolvedValue([]);

      await getPostsLikedByMe(mockReq, mockRes);

      expect(handleError).not.toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              title: expect.any(String),
              tags: expect.any(Array),
              author: expect.objectContaining({
                id: expect.any(String),
                username: expect.any(String),
              }),
              isBookmarked: expect.any(Boolean),
              isLiked: expect.any(Boolean),
            }),
          ]),
        })
      );
    });
  });
});
