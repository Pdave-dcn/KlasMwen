import { Request, Response } from "express";
import { it, expect, describe, vi, beforeEach } from "vitest";

import { searchPosts } from "../../controllers/search.controller.js";
import prisma from "../../core/config/db.js";
import { handleError } from "../../core/error/index";

vi.mock("../../core/error/index");

vi.mock("../../core/config/db.js", () => ({
  default: {
    post: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe("Search Controller", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  const mockPostId = "550e8400-e29b-41d4-a716-446655440000";
  const mockPostId2 = "b2c3d4e5-f678-9012-3456-7890abcdef12";

  const mockUserId = "c3d4e5f6-7890-1234-5678-90abcdef1234";
  const mockUserId2 = "d4e5f678-9012-3456-7890-abcdef123456";

  beforeEach(() => {
    vi.clearAllMocks();

    mockResponse = {
      status: vi.fn(() => mockResponse as Response),
      json: vi.fn(),
    };
  });

  describe("SearchPosts", () => {
    it("should return posts with the search term in the title or content", async () => {
      const searchTerm = "javascript";
      const mockPosts = [
        {
          id: mockPostId,
          title: "JavaScript Basics",
          type: "article",
          content: "Learn the fundamentals",
          fileUrl: null,
          fileName: null,
          createdAt: new Date("2024-01-01"),
          authorId: "user-1",
          postTags: [
            {
              postId: mockPostId,
              tagId: 1,
              tag: { id: 1, name: "programming" },
            },
          ],
          author: { id: mockUserId, username: "john_doe", avatarUrl: null },
          _count: { comments: 5, likes: 10 },
        },
        {
          id: mockPostId2,
          title: "Web Development",
          type: "article",
          content: "Building apps with JavaScript frameworks",
          fileUrl: null,
          fileName: null,
          createdAt: new Date("2024-01-02"),
          authorId: "user-2",
          postTags: [
            { postId: mockPostId2, tagId: 2, tag: { id: 2, name: "web" } },
          ],
          author: { id: mockUserId2, username: "jane_smith", avatarUrl: null },
          _count: { comments: 3, likes: 7 },
        },
      ];

      mockRequest = {
        query: {
          search: searchTerm,
          limit: "10",
        },
      };

      (prisma.post.findMany as any).mockResolvedValue([...mockPosts]);
      (prisma.post.count as any).mockResolvedValue(2);

      await searchPosts(mockRequest as Request, mockResponse as Response);

      expect(prisma.post.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            {
              title: {
                contains: searchTerm,
                mode: "insensitive",
              },
            },
            {
              content: {
                contains: searchTerm,
                mode: "insensitive",
              },
            },
          ],
        },
        select: {
          id: true,
          title: true,
          type: true,
          content: true,
          fileUrl: true,
          fileName: true,
          createdAt: true,
          postTags: { include: { tag: true } },
          author: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
          _count: { select: { comments: true, likes: true } },
        },
        take: 11,
        orderBy: [{ createdAt: "desc" }],
      });

      expect(prisma.post.count).toHaveBeenCalledWith({
        where: {
          OR: [
            {
              title: {
                contains: searchTerm,
                mode: "insensitive",
              },
            },
            {
              content: {
                contains: searchTerm,
                mode: "insensitive",
              },
            },
          ],
        },
      });

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: expect.any(Array),
        pagination: {
          hasMore: false,
          nextCursor: null,
          total: 2,
        },
        meta: {
          searchTerm,
          resultsFound: 2,
          currentPageSize: 2,
        },
      });
    });

    describe("Input Validation", () => {
      it("should call handleError when search term is missing", async () => {
        mockRequest = {
          query: {
            limit: "10",
          },
        };

        await searchPosts(mockRequest as Request, mockResponse as Response);

        expect(handleError).toHaveBeenCalled();
        expect(prisma.post.findMany).not.toHaveBeenCalled();
        expect(prisma.post.count).not.toHaveBeenCalled();
      });

      it("should call handleError return 400 when search term is empty string", async () => {
        mockRequest = {
          query: {
            search: "",
            limit: "10",
          },
        };

        await searchPosts(mockRequest as Request, mockResponse as Response);

        expect(handleError).toHaveBeenCalled();
        expect(prisma.post.findMany).not.toHaveBeenCalled();
      });

      it("should call handleError when search term is whitespace only", async () => {
        mockRequest = {
          query: {
            search: "   ",
            limit: "10",
          },
        };

        await searchPosts(mockRequest as Request, mockResponse as Response);

        expect(handleError).toHaveBeenCalled();
        expect(prisma.post.findMany).not.toHaveBeenCalled();
      });

      it("should call handleError when search term is less than 2 characters", async () => {
        mockRequest = {
          query: {
            search: "a",
            limit: "10",
          },
        };

        await searchPosts(mockRequest as Request, mockResponse as Response);

        expect(handleError).toHaveBeenCalled();
        expect(prisma.post.findMany).not.toHaveBeenCalled();
      });

      it("should call handleError when search term is longer than 100 characters", async () => {
        mockRequest = {
          query: {
            search: "a".repeat(101),
            limit: "10",
          },
        };

        await searchPosts(mockRequest as Request, mockResponse as Response);

        expect(handleError).toHaveBeenCalled();
        expect(prisma.post.findMany).not.toHaveBeenCalled();
      });

      it("should call handleError when cursor is invalid format", async () => {
        mockRequest = {
          query: {
            search: "javascript",
            limit: "10",
            cursor: 123 as any,
          },
        };

        await searchPosts(mockRequest as Request, mockResponse as Response);

        expect(handleError).toHaveBeenCalled();
        expect(prisma.post.findMany).not.toHaveBeenCalled();
      });

      it("should call handleError when search term is not a string", async () => {
        mockRequest = {
          query: {
            search: 123 as any,
            limit: "10",
          },
        };

        await searchPosts(mockRequest as Request, mockResponse as Response);

        expect(handleError).toHaveBeenCalled();
        expect(prisma.post.findMany).not.toHaveBeenCalled();
      });
    });

    describe("Pagination", () => {
      it("should return hasMore=true when there are more results than limit", async () => {
        const searchTerm = "javascript";
        const limit = 5;
        const mockPosts = Array.from({ length: 6 }, (_, i) => ({
          id: `post-${i}`,
          title: `JavaScript Tutorial ${i}`,
          type: "article",
          content: "Content about JavaScript",
          fileUrl: null,
          fileName: null,
          createdAt: new Date(`2024-01-0${i + 1}`),
          authorId: `user-${i}`,
          postTags: [],
          author: { id: `user-${i}`, username: `user${i}`, avatarUrl: null },
          _count: { comments: 0, likes: 0 },
        }));

        mockRequest = {
          query: {
            search: searchTerm,
            limit: limit.toString(),
          },
        };

        (prisma.post.findMany as any).mockResolvedValue(mockPosts);
        (prisma.post.count as any).mockResolvedValue(10);

        await searchPosts(mockRequest as Request, mockResponse as Response);

        expect(mockResponse.json).toHaveBeenCalledWith({
          data: expect.any(Array),
          pagination: {
            hasMore: true,
            nextCursor: "post-4",
            total: expect.any(Number),
          },
          meta: expect.any(Object),
        });
      });

      it("should return hasMore=false when results are equal to or less than limit", async () => {
        const searchTerm = "javascript";
        const limit = 10;
        const mockPosts = Array.from({ length: 5 }, (_, i) => ({
          id: `post-${i}`,
          title: `JavaScript Tutorial ${i}`,
          type: "article",
          content: "Content about JavaScript",
          fileUrl: null,
          fileName: null,
          createdAt: new Date(`2024-01-0${i + 1}`),
          authorId: `user-${i}`,
          postTags: [],
          author: { id: `user-${i}`, username: `user${i}`, avatarUrl: null },
          _count: { comments: 0, likes: 0 },
        }));

        mockRequest = {
          query: {
            search: searchTerm,
            limit: limit.toString(),
          },
        };

        (prisma.post.findMany as any).mockResolvedValue(mockPosts);
        (prisma.post.count as any).mockResolvedValue(5);

        await searchPosts(mockRequest as Request, mockResponse as Response);

        expect(mockResponse.json).toHaveBeenCalledWith({
          data: expect.any(Array),
          pagination: {
            hasMore: false,
            nextCursor: null,
            total: expect.any(Number),
          },
          meta: expect.any(Object),
        });
      });

      it("should handle cursor-based pagination correctly", async () => {
        const searchTerm = "javascript";
        const cursor = mockPostId;

        mockRequest = {
          query: {
            search: searchTerm,
            limit: "10",
            cursor,
          },
        };

        (prisma.post.findMany as any).mockResolvedValue([]);
        (prisma.post.count as any).mockResolvedValue(5);

        await searchPosts(mockRequest as Request, mockResponse as Response);

        expect(handleError).not.toHaveBeenCalled();
        expect(prisma.post.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            cursor: { id: cursor },
            skip: 1,
          })
        );
      });

      it("should cap limit at maximum of 50", async () => {
        const searchTerm = "javascript";

        mockRequest = {
          query: {
            search: searchTerm,
            limit: "100",
          },
        };

        await expect(
          searchPosts(mockRequest as Request, mockResponse as Response)
        ).resolves.not.toThrow();
        expect(handleError).not.toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(200);
      });

      it("should use default limit of 10 when not provided", async () => {
        const searchTerm = "javascript";

        mockRequest = {
          query: {
            search: searchTerm,
          },
        };

        (prisma.post.findMany as any).mockResolvedValue([]);
        (prisma.post.count as any).mockResolvedValue(0);

        await searchPosts(mockRequest as Request, mockResponse as Response);

        expect(prisma.post.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            take: 11,
          })
        );
      });
    });

    describe("Error Handling", () => {
      it("should call handleError when database query fails", async () => {
        const searchTerm = "javascript";
        const mockError = new Error("Database connection failed");

        mockRequest = {
          query: {
            search: searchTerm,
            limit: "10",
          },
        };

        (prisma.post.findMany as any).mockRejectedValue(mockError);

        await searchPosts(mockRequest as Request, mockResponse as Response);

        expect(handleError).toHaveBeenCalledWith(mockError, mockResponse);
      });

      it("should call handleError when count query fails", async () => {
        const searchTerm = "javascript";
        const mockError = new Error("Count query failed");

        mockRequest = {
          query: {
            search: searchTerm,
            limit: "10",
          },
        };

        (prisma.post.findMany as any).mockResolvedValue([]);
        (prisma.post.count as any).mockRejectedValue(mockError);

        await searchPosts(mockRequest as Request, mockResponse as Response);

        expect(handleError).toHaveBeenCalledWith(mockError, mockResponse);
      });
    });

    describe("Edge Cases", () => {
      it("should return empty results when no posts match search term", async () => {
        const searchTerm = "nonexistent";

        mockRequest = {
          query: {
            search: searchTerm,
            limit: "10",
          },
        };

        (prisma.post.findMany as any).mockResolvedValue([]);
        (prisma.post.count as any).mockResolvedValue(0);

        await searchPosts(mockRequest as Request, mockResponse as Response);

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({
          data: [],
          pagination: {
            hasMore: false,
            nextCursor: null,
            total: 0,
          },
          meta: {
            searchTerm,
            resultsFound: 0,
            currentPageSize: 0,
          },
        });
      });

      it("should handle special characters in search term", async () => {
        const searchTerm = "C++ & Java!";

        mockRequest = {
          query: {
            search: searchTerm,
            limit: "10",
          },
        };

        (prisma.post.findMany as any).mockResolvedValue([]);
        (prisma.post.count as any).mockResolvedValue(0);

        await searchPosts(mockRequest as Request, mockResponse as Response);

        expect(prisma.post.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              OR: [
                {
                  title: {
                    contains: searchTerm,
                    mode: "insensitive",
                  },
                },
                {
                  content: {
                    contains: searchTerm,
                    mode: "insensitive",
                  },
                },
              ],
            },
          })
        );
      });

      it("should trim whitespace from search term", async () => {
        const searchTermWithSpaces = "  javascript  ";
        const expectedSearchTerm = "javascript";

        mockRequest = {
          query: {
            search: searchTermWithSpaces,
            limit: "10",
          },
        };

        (prisma.post.findMany as any).mockResolvedValue([]);
        (prisma.post.count as any).mockResolvedValue(0);

        await searchPosts(mockRequest as Request, mockResponse as Response);

        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            meta: expect.objectContaining({
              searchTerm: expectedSearchTerm,
            }),
          })
        );
      });

      it("should handle SQL-like characters in search term", async () => {
        const searchTerm = "SELECT * FROM posts WHERE title LIKE '%test%'";

        mockRequest = {
          query: {
            search: searchTerm,
            limit: "10",
          },
        };

        (prisma.post.findMany as any).mockResolvedValue([]);
        (prisma.post.count as any).mockResolvedValue(0);

        await searchPosts(mockRequest as Request, mockResponse as Response);

        // Should not throw error and should sanitize the search term
        expect(prisma.post.findMany).toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(200);
      });
    });

    describe("Search Logic", () => {
      it("should find posts with search term only in title", async () => {
        const searchTerm = "javascript";
        const mockPost = {
          id: mockPostId,
          title: "JavaScript Guide",
          type: "article",
          content: "Learn programming fundamentals",
          fileUrl: null,
          fileName: null,
          createdAt: new Date("2024-01-01"),
          authorId: mockUserId,
          postTags: [],
          author: { id: mockUserId, username: "john_doe", avatarUrl: null },
          _count: { comments: 0, likes: 0 },
        };

        mockRequest = {
          query: {
            search: searchTerm,
            limit: "10",
          },
        };

        (prisma.post.findMany as any).mockResolvedValue([mockPost]);
        (prisma.post.count as any).mockResolvedValue(1);

        await searchPosts(mockRequest as Request, mockResponse as Response);

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.any(Array),
            meta: expect.objectContaining({
              resultsFound: 1,
              currentPageSize: 1,
            }),
          })
        );
      });

      it("should find posts with search term only in content", async () => {
        const searchTerm = "javascript";
        const mockPost = {
          id: mockPostId,
          title: "Programming Guide",
          type: "article",
          content: "This guide covers JavaScript fundamentals",
          fileUrl: null,
          fileName: null,
          createdAt: new Date("2024-01-01"),
          authorId: mockUserId,
          postTags: [],
          author: { id: mockUserId, username: "john_doe", avatarUrl: null },
          _count: { comments: 0, likes: 0 },
        };

        mockRequest = {
          query: {
            search: searchTerm,
            limit: "10",
          },
        };

        (prisma.post.findMany as any).mockResolvedValue([mockPost]);
        (prisma.post.count as any).mockResolvedValue(1);

        await searchPosts(mockRequest as Request, mockResponse as Response);

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            meta: expect.objectContaining({
              resultsFound: 1,
              currentPageSize: 1,
            }),
          })
        );
      });

      it("should perform case-insensitive search", async () => {
        const searchTerm = "JAVASCRIPT";

        mockRequest = {
          query: {
            search: searchTerm,
            limit: "10",
          },
        };

        (prisma.post.findMany as any).mockResolvedValue([]);
        (prisma.post.count as any).mockResolvedValue(0);

        await searchPosts(mockRequest as Request, mockResponse as Response);

        expect(prisma.post.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              OR: [
                {
                  title: {
                    contains: searchTerm,
                    mode: "insensitive",
                  },
                },
                {
                  content: {
                    contains: searchTerm,
                    mode: "insensitive",
                  },
                },
              ],
            },
          })
        );
      });
    });
  });
});
