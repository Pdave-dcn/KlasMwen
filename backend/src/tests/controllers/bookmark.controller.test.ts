import { Request, Response } from "express";
import { it, expect, describe, vi, beforeEach } from "vitest";

import {
  createBookmark,
  deleteBookmark,
  getBookmarks,
} from "../../controllers/bookmark.controller.js";
import prisma from "../../core/config/db.js";
import { AuthenticationError } from "../../core/error/custom/auth.error.js";
import { handleError } from "../../core/error/index.js";

import type { Post, Bookmark } from "@prisma/client";

vi.mock("../../core/config/db.js", () => ({
  default: {
    post: {
      findUnique: vi.fn(),
    },
    bookmark: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("../../core/error/index.js");

describe("Bookmark controller", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  const mockPostId = "550e8400-e29b-41d4-a716-446655440000";
  const mockUserId2 = "d4e5f678-9012-3456-7890-abcdef123456";
  const mockUserId = "c3d4e5f6-7890-1234-5678-90abcdef1234";
  const mockCursorPostId = "660e8400-e29b-41d4-a716-446655440001";

  beforeEach(() => {
    vi.clearAllMocks();
    mockResponse = {
      status: vi.fn(() => mockResponse as Response),
      json: vi.fn(),
    };
  });

  describe("createBookmark", () => {
    it("should create a bookmark successfully", async () => {
      mockRequest = {
        body: {},
        user: {
          id: mockUserId,
          role: "STUDENT",
          username: "test_username",
          email: "test_email",
        },
        params: { id: mockPostId },
      };

      const mockPost: Post = {
        id: mockPostId,
        title: "JavaScript Basics",
        type: "NOTE",
        content: "Learn the fundamentals",
        fileUrl: null,
        fileName: null,
        fileSize: null,
        mimeType: null,
        createdAt: new Date("2025-01-01"),
        updatedAt: new Date("2025-01-01"),
        authorId: mockUserId2,
      };

      const mockCreatedBookmark: Bookmark = {
        userId: mockUserId,
        postId: mockPostId,
        createdAt: new Date("2025-08-18"),
      };

      vi.mocked(prisma.post.findUnique).mockResolvedValue(mockPost);
      vi.mocked(prisma.bookmark.create).mockResolvedValue(mockCreatedBookmark);

      await createBookmark(mockRequest as Request, mockResponse as Response);

      expect(handleError).not.toHaveBeenCalled();
      expect(prisma.post.findUnique).toHaveBeenCalledWith({
        where: { id: mockPostId },
      });
      expect(prisma.bookmark.create).toHaveBeenCalledWith({
        data: { userId: mockUserId, postId: mockPostId },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Post bookmarked successfully",
      });
    });

    it("should return 404 when post does not exist", async () => {
      mockRequest = {
        body: {},
        user: {
          id: mockUserId,
          role: "STUDENT",
          username: "test_username",
          email: "test_email",
        },
        params: { id: mockPostId },
      };

      vi.mocked(prisma.post.findUnique).mockResolvedValue(null);

      await createBookmark(mockRequest as Request, mockResponse as Response);

      expect(prisma.post.findUnique).toHaveBeenCalledWith({
        where: { id: mockPostId },
      });
      expect(prisma.bookmark.create).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Post not found",
      });
    });

    it("should call handleError with AuthenticationError when user is not authenticated", async () => {
      mockRequest = {
        body: {},
        params: { id: mockPostId },
      };

      await createBookmark(mockRequest as Request, mockResponse as Response);

      expect(handleError).toHaveBeenCalledWith(
        expect.any(AuthenticationError),
        mockResponse
      );
    });

    it("should call handleError with validation error for invalid post ID", async () => {
      mockRequest = {
        body: {},
        user: {
          id: mockUserId,
          role: "STUDENT",
          username: "test_username",
          email: "test_email",
        },
        params: { id: "invalid-uuid" },
      };

      await createBookmark(mockRequest as Request, mockResponse as Response);

      expect(handleError).toHaveBeenCalled();
      expect(prisma.post.findUnique).not.toHaveBeenCalled();
    });

    it("should handle database errors", async () => {
      mockRequest = {
        body: {},
        user: {
          id: mockUserId,
          role: "STUDENT",
          username: "test_username",
          email: "test_email",
        },
        params: { id: mockPostId },
      };

      const mockPost: Post = {
        id: mockPostId,
        title: "JavaScript Basics",
        type: "NOTE",
        content: "Learn the fundamentals",
        fileUrl: null,
        fileName: null,
        fileSize: null,
        mimeType: null,
        createdAt: new Date("2025-01-01"),
        updatedAt: new Date("2025-01-01"),
        authorId: mockUserId2,
      };

      const dbError = new Error("Database connection failed");
      vi.mocked(prisma.post.findUnique).mockResolvedValue(mockPost);
      vi.mocked(prisma.bookmark.create).mockRejectedValue(dbError);

      await createBookmark(mockRequest as Request, mockResponse as Response);

      expect(handleError).toHaveBeenCalledWith(dbError, mockResponse);
    });
  });

  describe("deleteBookmark", () => {
    it("should delete a bookmark successfully", async () => {
      mockRequest = {
        body: {},
        user: {
          id: mockUserId,
          role: "STUDENT",
          username: "test_username",
          email: "test_email",
        },
        params: { id: mockPostId },
      };

      const mockExistingBookmark: Bookmark = {
        userId: mockUserId,
        postId: mockPostId,
        createdAt: new Date("2025-08-18"),
      };

      vi.mocked(prisma.bookmark.findUnique).mockResolvedValue(
        mockExistingBookmark
      );
      vi.mocked(prisma.bookmark.delete).mockResolvedValue(mockExistingBookmark);

      await deleteBookmark(mockRequest as Request, mockResponse as Response);

      expect(handleError).not.toHaveBeenCalled();
      expect(prisma.bookmark.findUnique).toHaveBeenCalledWith({
        where: { userId_postId: { userId: mockUserId, postId: mockPostId } },
      });
      expect(prisma.bookmark.delete).toHaveBeenCalledWith({
        where: { userId_postId: { userId: mockUserId, postId: mockPostId } },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Bookmark removed successfully",
      });
    });

    it("should return 404 when bookmark does not exist", async () => {
      mockRequest = {
        body: {},
        user: {
          id: mockUserId,
          role: "STUDENT",
          username: "test_username",
          email: "test_email",
        },
        params: { id: mockPostId },
      };

      vi.mocked(prisma.bookmark.findUnique).mockResolvedValue(null);

      await deleteBookmark(mockRequest as Request, mockResponse as Response);

      expect(prisma.bookmark.findUnique).toHaveBeenCalledWith({
        where: { userId_postId: { userId: mockUserId, postId: mockPostId } },
      });
      expect(prisma.bookmark.delete).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Bookmark not found",
      });
    });

    it("should call handleError with AuthenticationError when user is not authenticated", async () => {
      mockRequest = {
        body: {},
        params: { id: mockPostId },
      };

      await deleteBookmark(mockRequest as Request, mockResponse as Response);

      expect(handleError).toHaveBeenCalledWith(
        expect.any(AuthenticationError),
        mockResponse
      );
    });

    it("should call handleError with validation error for invalid post ID", async () => {
      mockRequest = {
        body: {},
        user: {
          id: mockUserId,
          role: "STUDENT",
          username: "test_username",
          email: "test_email",
        },
        params: { id: "invalid-uuid" },
      };

      await deleteBookmark(mockRequest as Request, mockResponse as Response);

      expect(handleError).toHaveBeenCalled();
      expect(prisma.bookmark.findUnique).not.toHaveBeenCalled();
    });

    it("should handle database errors during deletion", async () => {
      mockRequest = {
        body: {},
        user: {
          id: mockUserId,
          role: "STUDENT",
          username: "test_username",
          email: "test_email",
        },
        params: { id: mockPostId },
      };

      const mockExistingBookmark: Bookmark = {
        userId: mockUserId,
        postId: mockPostId,
        createdAt: new Date("2025-08-18"),
      };

      const dbError = new Error("Database connection failed");
      vi.mocked(prisma.bookmark.findUnique).mockResolvedValue(
        mockExistingBookmark
      );
      vi.mocked(prisma.bookmark.delete).mockRejectedValue(dbError);

      await deleteBookmark(mockRequest as Request, mockResponse as Response);

      expect(handleError).toHaveBeenCalledWith(dbError, mockResponse);
    });
  });

  describe("getBookmarks", () => {
    const mockBookmarksWithPosts = [
      {
        userId: mockUserId,
        postId: mockPostId,
        createdAt: new Date("2025-08-18"),
        post: {
          id: mockPostId,
          title: "JavaScript Basics",
          content: "Learn the fundamentals",
          type: "NOTE",
          fileUrl: null,
          fileName: null,
          createdAt: new Date("2025-01-01"),
          author: {
            id: mockUserId2,
            username: "author1",
            avatarUrl: null,
          },
          postTags: [
            {
              postId: mockPostId,
              tagId: "tag1",
              tag: { id: "tag1", name: "javaScript" },
            },
            {
              postId: mockPostId,
              tagId: "tag2",
              tag: { id: "tag2", name: "tutorial" },
            },
          ],
          _count: { comments: 5, likes: 10 },
        },
      },
      {
        userId: mockUserId,
        postId: mockCursorPostId,
        createdAt: new Date("2025-08-17"),
        post: {
          id: mockCursorPostId,
          title: "React Components",
          content: "Understanding components",
          type: "NOTE",
          fileUrl: null,
          fileName: null,
          createdAt: new Date("2025-01-02"),
          author: {
            id: mockUserId2,
            username: "author2",
            avatarUrl: "avatar.jpg",
          },
          postTags: [
            {
              postId: mockCursorPostId,
              tagId: "tag3",
              tag: { id: "tag3", name: "React" },
            },
          ],
          _count: { comments: 3, likes: 8 },
        },
      },
    ];

    it("should get bookmarks successfully with default pagination", async () => {
      mockRequest = {
        query: {},
        user: {
          id: mockUserId,
          role: "STUDENT",
          username: "test_username",
          email: "test_email",
        },
      };

      vi.mocked(prisma.bookmark.findMany).mockResolvedValue(
        mockBookmarksWithPosts
      );

      await getBookmarks(mockRequest as Request, mockResponse as Response);

      expect(prisma.bookmark.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        orderBy: { createdAt: "desc" },
        include: {
          post: {
            select: {
              id: true,
              title: true,
              content: true,
              type: true,
              fileUrl: true,
              fileName: true,
              createdAt: true,
              author: {
                select: { id: true, username: true, avatarUrl: true },
              },
              postTags: {
                include: { tag: true },
              },
              _count: {
                select: { comments: true, likes: true },
              },
            },
          },
        },
        take: 11,
      });

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: expect.any(Array),
        pagination: {
          hasMore: false,
          nextCursor: null,
        },
      });
    });

    it("should get bookmarks with custom limit", async () => {
      mockRequest = {
        query: { limit: "5" },
        user: {
          id: mockUserId,
          role: "STUDENT",
          username: "test_username",
          email: "test_email",
        },
      };

      vi.mocked(prisma.bookmark.findMany).mockResolvedValue(
        mockBookmarksWithPosts
      );

      await getBookmarks(mockRequest as Request, mockResponse as Response);

      expect(prisma.bookmark.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        orderBy: { createdAt: "desc" },
        include: {
          post: {
            select: {
              id: true,
              title: true,
              content: true,
              type: true,
              fileUrl: true,
              fileName: true,
              createdAt: true,
              author: {
                select: { id: true, username: true, avatarUrl: true },
              },
              postTags: {
                include: { tag: true },
              },
              _count: {
                select: { comments: true, likes: true },
              },
            },
          },
        },
        take: 6,
      });
    });

    it("should get bookmarks with cursor pagination", async () => {
      mockRequest = {
        query: { cursor: mockCursorPostId },
        user: {
          id: mockUserId,
          role: "STUDENT",
          username: "test_username",
          email: "test_email",
        },
      };

      vi.mocked(prisma.bookmark.findMany).mockResolvedValue(
        mockBookmarksWithPosts
      );

      await getBookmarks(mockRequest as Request, mockResponse as Response);

      expect(prisma.bookmark.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        orderBy: { createdAt: "desc" },
        include: {
          post: {
            select: {
              id: true,
              title: true,
              content: true,
              type: true,
              fileUrl: true,
              fileName: true,
              createdAt: true,
              author: {
                select: { id: true, username: true, avatarUrl: true },
              },
              postTags: {
                include: { tag: true },
              },
              _count: {
                select: { comments: true, likes: true },
              },
            },
          },
        },
        take: 11,
        cursor: {
          userId_postId: { userId: mockUserId, postId: mockCursorPostId },
        },
        skip: 1,
      });
    });

    it("should handle pagination correctly when there are more results", async () => {
      mockRequest = {
        query: { limit: "1" },
        user: {
          id: mockUserId,
          role: "STUDENT",
          username: "test_username",
          email: "test_email",
        },
      };

      vi.mocked(prisma.bookmark.findMany).mockResolvedValue(
        mockBookmarksWithPosts
      );

      await getBookmarks(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ id: mockPostId }),
        ]),
        pagination: {
          hasMore: true,
          nextCursor: mockPostId,
        },
      });
    });

    it("should call handleError with AuthenticationError when user is not authenticated", async () => {
      mockRequest = {
        query: {},
      };

      await getBookmarks(mockRequest as Request, mockResponse as Response);

      expect(handleError).toHaveBeenCalledWith(
        expect.any(AuthenticationError),
        mockResponse
      );
    });

    it("should call handleError with validation error for invalid limit", async () => {
      mockRequest = {
        query: { limit: "invalid" },
        user: {
          id: mockUserId,
          role: "STUDENT",
          username: "test_username",
          email: "test_email",
        },
      };

      await getBookmarks(mockRequest as Request, mockResponse as Response);

      expect(handleError).toHaveBeenCalled();
      expect(prisma.bookmark.findMany).not.toHaveBeenCalled();
    });

    it("should call handleError with validation error for invalid cursor UUID", async () => {
      mockRequest = {
        query: { cursor: "invalid-uuid" },
        user: {
          id: mockUserId,
          role: "STUDENT",
          username: "test_username",
          email: "test_email",
        },
      };

      await getBookmarks(mockRequest as Request, mockResponse as Response);

      expect(handleError).toHaveBeenCalled();
      expect(prisma.bookmark.findMany).not.toHaveBeenCalled();
    });

    it("should handle database errors", async () => {
      mockRequest = {
        query: {},
        user: {
          id: mockUserId,
          role: "STUDENT",
          username: "test_username",
          email: "test_email",
        },
      };

      const dbError = new Error("Database connection failed");
      vi.mocked(prisma.bookmark.findMany).mockRejectedValue(dbError);

      await getBookmarks(mockRequest as Request, mockResponse as Response);

      expect(handleError).toHaveBeenCalledWith(dbError, mockResponse);
    });

    it("should return empty array when user has no bookmarks", async () => {
      mockRequest = {
        query: {},
        user: {
          id: mockUserId,
          role: "STUDENT",
          username: "test_username",
          email: "test_email",
        },
      };

      vi.mocked(prisma.bookmark.findMany).mockResolvedValue([]);

      await getBookmarks(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: [],
        pagination: {
          hasMore: false,
          nextCursor: null,
        },
      });
    });
  });
});
