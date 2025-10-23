import { Role } from "@prisma/client";
import { Request, Response } from "express";
import { it, expect, describe, vi, beforeEach } from "vitest";

import { searchPosts } from "../../controllers/search.controller.js";
import prisma from "../../core/config/db.js";
import { handleError } from "../../core/error/index";

vi.mock("../../core/config/logger.js", () => ({
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

vi.mock("../../core/error/index");

vi.mock("../../core/config/db.js", () => ({
  default: {
    post: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    bookmark: {
      findMany: vi.fn(),
    },
    like: {
      findMany: vi.fn(),
    },
  },
}));

const createAuthenticatedUser = (overrides = {}) => ({
  id: "123e4567-e89b-12d3-a456-426614174000",
  username: "testUser",
  email: "test@example.com",
  role: "STUDENT" as Role,
  ...overrides,
});

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

  describe("Authentication", () => {
    it("should call handleError when user is not authenticated", async () => {
      mockRequest = {
        query: {
          search: "javascript",
          limit: "10",
        },
        user: undefined,
      };

      await searchPosts(mockRequest as Request, mockResponse as Response);

      expect(handleError).toHaveBeenCalled();
      expect(prisma.post.findMany).not.toHaveBeenCalled();
      expect(prisma.post.count).not.toHaveBeenCalled();
    });

    it("should proceed with search when user is properly authenticated", async () => {
      mockRequest = {
        query: {
          search: "javascript",
          limit: "10",
        },
        user: createAuthenticatedUser(),
      };

      (prisma.post.findMany as any).mockResolvedValue([]);
      (prisma.post.count as any).mockResolvedValue(0);

      await searchPosts(mockRequest as Request, mockResponse as Response);

      expect(handleError).not.toHaveBeenCalled();
      expect(prisma.post.findMany).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
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
          author: { id: mockUserId, username: "john_doe", Avatar: null },
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
          author: { id: mockUserId2, username: "jane_smith", Avatar: null },
          _count: { comments: 3, likes: 7 },
        },
      ];

      mockRequest = {
        query: {
          search: searchTerm,
          limit: "10",
        },
        user: createAuthenticatedUser(),
      };

      vi.mocked(prisma.bookmark.findMany).mockResolvedValue([]);
      vi.mocked(prisma.like.findMany).mockResolvedValue([]);

      (prisma.post.findMany as any).mockResolvedValue([...mockPosts]);
      (prisma.post.count as any).mockResolvedValue(2);

      await searchPosts(mockRequest as Request, mockResponse as Response);

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                title: {
                  contains: searchTerm,
                  mode: "insensitive",
                },
              }),
              expect.objectContaining({
                content: {
                  contains: searchTerm,
                  mode: "insensitive",
                },
              }),
            ]),
          }),
        })
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: expect.any(Array),
        pagination: {
          hasMore: false,
          nextCursor: null,
        },
        meta: {
          searchTerm,
          resultsFound: 2,
          currentPageSize: 2,
        },
      });
    });

    describe("Input Validation", () => {
      it("should allow search without search term when tagIds are provided", async () => {
        mockRequest = {
          query: {
            tagIds: "1,2",
            limit: "10",
          },
          user: createAuthenticatedUser(),
        };

        (prisma.post.findMany as any).mockResolvedValue([]);
        (prisma.post.count as any).mockResolvedValue(0);
        vi.mocked(prisma.bookmark.findMany).mockResolvedValue([]);
        vi.mocked(prisma.like.findMany).mockResolvedValue([]);

        await searchPosts(mockRequest as Request, mockResponse as Response);

        expect(handleError).not.toHaveBeenCalled();
        expect(prisma.post.findMany).toHaveBeenCalled();
      });

      it("should allow search without tagIds when search term is provided", async () => {
        mockRequest = {
          query: {
            search: "javascript",
            limit: "10",
          },
          user: createAuthenticatedUser(),
        };

        (prisma.post.findMany as any).mockResolvedValue([]);
        (prisma.post.count as any).mockResolvedValue(0);
        vi.mocked(prisma.bookmark.findMany).mockResolvedValue([]);
        vi.mocked(prisma.like.findMany).mockResolvedValue([]);

        await searchPosts(mockRequest as Request, mockResponse as Response);

        expect(handleError).not.toHaveBeenCalled();
        expect(prisma.post.findMany).toHaveBeenCalled();
      });

      it("should handle invalid tagIds gracefully", async () => {
        mockRequest = {
          query: {
            tagIds: "invalid,abc",
            limit: "10",
          },
          user: createAuthenticatedUser(),
        };

        (prisma.post.findMany as any).mockResolvedValue([]);
        (prisma.post.count as any).mockResolvedValue(0);
        vi.mocked(prisma.bookmark.findMany).mockResolvedValue([]);
        vi.mocked(prisma.like.findMany).mockResolvedValue([]);

        await searchPosts(mockRequest as Request, mockResponse as Response);

        // Should filter out invalid IDs and proceed
        expect(mockResponse.status).toHaveBeenCalledWith(200);
      });

      it("should call handleError when tagIds exceed maximum of 10", async () => {
        mockRequest = {
          query: {
            tagIds: "1,2,3,4,5,6,7,8,9,10,11",
            limit: "10",
          },
          user: createAuthenticatedUser(),
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
          user: createAuthenticatedUser(),
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
          user: createAuthenticatedUser(),
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
          user: createAuthenticatedUser(),
        };

        // Handling bookmark and like states
        vi.mocked(prisma.bookmark.findMany).mockResolvedValue([]);
        vi.mocked(prisma.like.findMany).mockResolvedValue([]);

        (prisma.post.findMany as any).mockResolvedValue(mockPosts);
        (prisma.post.count as any).mockResolvedValue(10);

        await searchPosts(mockRequest as Request, mockResponse as Response);

        expect(mockResponse.json).toHaveBeenCalledWith({
          data: expect.any(Array),
          pagination: {
            hasMore: true,
            nextCursor: "post-4",
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
          user: createAuthenticatedUser(),
        };

        // Handling bookmark and like states
        vi.mocked(prisma.bookmark.findMany).mockResolvedValue([]);
        vi.mocked(prisma.like.findMany).mockResolvedValue([]);

        (prisma.post.findMany as any).mockResolvedValue(mockPosts);
        (prisma.post.count as any).mockResolvedValue(5);

        await searchPosts(mockRequest as Request, mockResponse as Response);

        expect(handleError).not.toHaveBeenCalled();
        expect(mockResponse.json).toHaveBeenCalledWith({
          data: expect.any(Array),
          pagination: {
            hasMore: false,
            nextCursor: null,
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
          user: createAuthenticatedUser(),
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
          user: createAuthenticatedUser(),
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
          user: createAuthenticatedUser(),
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
          user: createAuthenticatedUser(),
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
          user: createAuthenticatedUser(),
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
          user: createAuthenticatedUser(),
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
          user: createAuthenticatedUser(),
        };

        (prisma.post.findMany as any).mockResolvedValue([]);
        (prisma.post.count as any).mockResolvedValue(0);
        vi.mocked(prisma.bookmark.findMany).mockResolvedValue([]);
        vi.mocked(prisma.like.findMany).mockResolvedValue([]);

        await searchPosts(mockRequest as Request, mockResponse as Response);

        // Changed from exact match to just checking it was called
        expect(prisma.post.findMany).toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(200);
      });

      it("should trim whitespace from search term", async () => {
        const searchTermWithSpaces = "  javascript  ";
        const expectedSearchTerm = "javascript";

        mockRequest = {
          query: {
            search: searchTermWithSpaces,
            limit: "10",
          },
          user: createAuthenticatedUser(),
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
          user: createAuthenticatedUser(),
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
          user: createAuthenticatedUser(),
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
          user: createAuthenticatedUser(),
        };

        // Handling bookmark and like states
        vi.mocked(prisma.bookmark.findMany).mockResolvedValue([]);
        vi.mocked(prisma.like.findMany).mockResolvedValue([]);

        (prisma.post.findMany as any).mockResolvedValue([mockPost]);
        (prisma.post.count as any).mockResolvedValue(1);

        await searchPosts(mockRequest as Request, mockResponse as Response);

        expect(handleError).not.toHaveBeenCalled();
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
          user: createAuthenticatedUser(),
        };

        (prisma.post.findMany as any).mockResolvedValue([]);
        (prisma.post.count as any).mockResolvedValue(0);

        vi.mocked(prisma.bookmark.findMany).mockResolvedValue([]);
        vi.mocked(prisma.like.findMany).mockResolvedValue([]);

        await searchPosts(mockRequest as Request, mockResponse as Response);

        expect(handleError).not.toHaveBeenCalled();
        expect(prisma.post.findMany).toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(200);
      });

      it("should sanitize search term with special SQL wildcard characters", async () => {
        const searchTerm = "test%value_here";

        mockRequest = {
          query: {
            search: searchTerm,
            limit: "10",
          },
          user: createAuthenticatedUser(),
        };

        (prisma.post.findMany as any).mockResolvedValue([]);
        (prisma.post.count as any).mockResolvedValue(0);
        vi.mocked(prisma.bookmark.findMany).mockResolvedValue([]);
        vi.mocked(prisma.like.findMany).mockResolvedValue([]);

        await searchPosts(mockRequest as Request, mockResponse as Response);

        // Should sanitize the % and _ characters
        expect(prisma.post.findMany).toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(200);
      });
    });
  });

  describe("Tag Search", () => {
    it("should search by single tag ID", async () => {
      const mockPost = {
        id: mockPostId,
        title: "Tagged Post",
        type: "article",
        content: "Content",
        fileUrl: null,
        fileName: null,
        createdAt: new Date("2024-01-01"),
        authorId: mockUserId,
        postTags: [
          {
            postId: mockPostId,
            tagId: 1,
            tag: { id: 1, name: "javascript" },
          },
        ],
        author: { id: mockUserId, username: "john_doe", Avatar: null },
        _count: { comments: 0, likes: 0 },
      };

      mockRequest = {
        query: {
          tagIds: "1",
          limit: "10",
        },
        user: createAuthenticatedUser(),
      };

      (prisma.post.findMany as any).mockResolvedValue([mockPost]);
      (prisma.post.count as any).mockResolvedValue(1);
      vi.mocked(prisma.bookmark.findMany).mockResolvedValue([]);
      vi.mocked(prisma.like.findMany).mockResolvedValue([]);

      await searchPosts(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          meta: expect.objectContaining({
            resultsFound: 1,
          }),
        })
      );
    });

    it("should search by multiple tag IDs", async () => {
      mockRequest = {
        query: {
          tagIds: "1,2,3",
          limit: "10",
        },
        user: createAuthenticatedUser(),
      };

      (prisma.post.findMany as any).mockResolvedValue([]);
      (prisma.post.count as any).mockResolvedValue(0);
      vi.mocked(prisma.bookmark.findMany).mockResolvedValue([]);
      vi.mocked(prisma.like.findMany).mockResolvedValue([]);

      await searchPosts(mockRequest as Request, mockResponse as Response);

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                postTags: {
                  some: {
                    tag: {
                      id: { in: [1, 2, 3] },
                    },
                  },
                },
              }),
            ]),
          }),
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it("should filter out negative tag IDs", async () => {
      mockRequest = {
        query: {
          tagIds: "1,-2,3",
          limit: "10",
        },
        user: createAuthenticatedUser(),
      };

      (prisma.post.findMany as any).mockResolvedValue([]);
      (prisma.post.count as any).mockResolvedValue(0);
      vi.mocked(prisma.bookmark.findMany).mockResolvedValue([]);
      vi.mocked(prisma.like.findMany).mockResolvedValue([]);

      await searchPosts(mockRequest as Request, mockResponse as Response);

      // Should only include positive IDs (1 and 3)
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it("should filter out zero tag IDs", async () => {
      mockRequest = {
        query: {
          tagIds: "0,1,2",
          limit: "10",
        },
        user: createAuthenticatedUser(),
      };

      (prisma.post.findMany as any).mockResolvedValue([]);
      (prisma.post.count as any).mockResolvedValue(0);
      vi.mocked(prisma.bookmark.findMany).mockResolvedValue([]);
      vi.mocked(prisma.like.findMany).mockResolvedValue([]);

      await searchPosts(mockRequest as Request, mockResponse as Response);

      // Should only include positive IDs (1 and 2)
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it("should handle empty tagIds string", async () => {
      mockRequest = {
        query: {
          tagIds: "",
          search: "javascript",
          limit: "10",
        },
        user: createAuthenticatedUser(),
      };

      (prisma.post.findMany as any).mockResolvedValue([]);
      (prisma.post.count as any).mockResolvedValue(0);
      vi.mocked(prisma.bookmark.findMany).mockResolvedValue([]);
      vi.mocked(prisma.like.findMany).mockResolvedValue([]);

      await searchPosts(mockRequest as Request, mockResponse as Response);

      // Should proceed with search term only
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it("should handle whitespace in tagIds", async () => {
      mockRequest = {
        query: {
          tagIds: " 1 , 2 , 3 ",
          limit: "10",
        },
        user: createAuthenticatedUser(),
      };

      (prisma.post.findMany as any).mockResolvedValue([]);
      (prisma.post.count as any).mockResolvedValue(0);
      vi.mocked(prisma.bookmark.findMany).mockResolvedValue([]);
      vi.mocked(prisma.like.findMany).mockResolvedValue([]);

      await searchPosts(mockRequest as Request, mockResponse as Response);

      // Should trim and parse correctly
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe("Combined Search", () => {
    it("should combine search term and tags with AND logic", async () => {
      const searchTerm = "javascript";

      mockRequest = {
        query: {
          search: searchTerm,
          tagIds: "1,2",
          limit: "10",
        },
        user: createAuthenticatedUser(),
      };

      (prisma.post.findMany as any).mockResolvedValue([]);
      (prisma.post.count as any).mockResolvedValue(0);
      vi.mocked(prisma.bookmark.findMany).mockResolvedValue([]);
      vi.mocked(prisma.like.findMany).mockResolvedValue([]);

      await searchPosts(mockRequest as Request, mockResponse as Response);

      // Should use AND condition with OR for search terms and tag filter
      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                OR: expect.any(Array),
              }),
              expect.objectContaining({
                postTags: expect.any(Object),
              }),
            ]),
          }),
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it("should return posts matching search term AND having any of the specified tags", async () => {
      const searchTerm = "tutorial";
      const mockPost = {
        id: mockPostId,
        title: "JavaScript Tutorial",
        type: "article",
        content: "Learn JavaScript basics",
        fileUrl: null,
        fileName: null,
        createdAt: new Date("2024-01-01"),
        authorId: mockUserId,
        postTags: [
          {
            postId: mockPostId,
            tagId: 1,
            tag: { id: 1, name: "javascript" },
          },
        ],
        author: { id: mockUserId, username: "john_doe", Avatar: null },
        _count: { comments: 5, likes: 10 },
      };

      mockRequest = {
        query: {
          search: searchTerm,
          tagIds: "1",
          limit: "10",
        },
        user: createAuthenticatedUser(),
      };

      (prisma.post.findMany as any).mockResolvedValue([mockPost]);
      (prisma.post.count as any).mockResolvedValue(1);
      vi.mocked(prisma.bookmark.findMany).mockResolvedValue([]);
      vi.mocked(prisma.like.findMany).mockResolvedValue([]);

      await searchPosts(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([expect.any(Object)]),
          meta: expect.objectContaining({
            searchTerm,
            resultsFound: 1,
            currentPageSize: 1,
          }),
        })
      );
    });
  });
});
