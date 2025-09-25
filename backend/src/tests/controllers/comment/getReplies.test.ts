import { Request, Response } from "express";

import { getReplies } from "../../../controllers/comment.controller";
import prisma from "../../../core/config/db";
import { handleError } from "../../../core/error";

import {
  createMockRequest,
  createMockResponse,
  mockReplies,
} from "./shared/mocks";

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

vi.mock("../../../core/error/index", () => ({
  handleError: vi.fn(),
}));

vi.mock("../../../core/config/db.js", () => ({
  default: {
    post: {
      findUnique: vi.fn(),
    },
    comment: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe("getReplies controller", () => {
  let mockRequest: Request;
  let mockResponse: Response;

  beforeEach(() => {
    mockRequest = createMockRequest();
    mockResponse = createMockResponse();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("Success Cases", () => {
    it("should return a list of replies with pagination data", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.query = { limit: "2" };

      vi.mocked(prisma.comment.findUnique).mockResolvedValue({
        id: 1,
        content: "test content",
        parentId: null,
        postId: "abc",
        authorId: "def",
        createdAt: new Date(),
      });

      vi.mocked(prisma.comment.findMany).mockResolvedValue(mockReplies);
      vi.mocked(prisma.comment.count).mockResolvedValue(12);

      await getReplies(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: mockReplies.slice(0, 2),
        pagination: {
          nextCursor: 6,
          hasMore: true,
          totalItems: 12,
        },
      });

      expect(prisma.comment.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.comment.count).toHaveBeenCalledTimes(1);

      expect(prisma.comment.count).toHaveBeenCalledWith({
        where: { parentId: 1 },
      });
    });

    it("should return a list of replies with cursor", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.query = { limit: "2", cursor: "10" };

      const mockReplies2 = [
        {
          id: 9,
          content: "Reply after cursor",
          author: { id: "authorD", username: "userD", avatarUrl: null },
          createdAt: new Date(),
          parentId: 1,
          postId: "post123",
          authorId: "authorD",
        },
        {
          id: 8,
          content: "Another reply after cursor",
          author: { id: "authorE", username: "userE", avatarUrl: null },
          createdAt: new Date(),
          parentId: 1,
          postId: "post123",
          authorId: "authorE",
        },
      ];

      vi.mocked(prisma.comment.findUnique).mockResolvedValue({
        id: 1,
        content: "test content",
        parentId: null,
        postId: "abc",
        authorId: "def",
        createdAt: new Date(),
      });

      vi.mocked(prisma.comment.findMany).mockResolvedValue(mockReplies2);
      vi.mocked(prisma.comment.count).mockResolvedValue(12);

      await getReplies(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: mockReplies2,
        pagination: {
          nextCursor: null,
          hasMore: false,
          totalItems: 12,
        },
      });

      expect(prisma.comment.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.comment.count).toHaveBeenCalledTimes(1);

      expect(prisma.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { parentId: 1 },
          orderBy: { createdAt: "asc" },
          take: 3,
          cursor: { id: 10 },
          skip: 1,
          select: expect.objectContaining({
            id: true,
            content: true,
            author: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
            createdAt: true,
          }),
        })
      );

      expect(prisma.comment.count).toHaveBeenCalledWith({
        where: { parentId: 1 },
      });
    });

    it("should use default pagination values if none are provided", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.query = {};

      vi.mocked(prisma.comment.findUnique).mockResolvedValue({
        id: 1,
        content: "test content",
        parentId: null,
        postId: "abc",
        authorId: "def",
        createdAt: new Date(),
      });

      vi.mocked(prisma.comment.findMany).mockResolvedValue([]);
      vi.mocked(prisma.comment.count).mockResolvedValue(0);

      await getReplies(mockRequest, mockResponse);

      expect(prisma.comment.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.comment.count).toHaveBeenCalledTimes(1);

      expect(prisma.comment.count).toHaveBeenCalledWith({
        where: { parentId: 1 },
      });

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          pagination: expect.objectContaining({
            nextCursor: null,
            hasMore: false,
            totalItems: 0,
          }),
        })
      );
    });
  });

  describe("Error Cases", () => {
    it("should return 400 if the parent ID is not a number", async () => {
      mockRequest.params = { id: "abc" };
      mockRequest.query = {};

      await getReplies(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Invalid parent ID!",
      });
      expect(prisma.comment.findMany).not.toHaveBeenCalled();
    });

    it("should return 404 if the parent is not a found", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.query = {};

      vi.mocked(prisma.comment.findUnique).mockResolvedValue(null);

      await getReplies(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Parent comment not found",
      });
      expect(prisma.comment.findMany).not.toHaveBeenCalled();
    });

    it("should call handleError for unexpected errors", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.query = {};

      const error = new Error("Database error on transaction");
      vi.mocked(prisma.comment.findUnique).mockRejectedValue(error);

      await getReplies(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalledWith(error, mockResponse);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe("Pagination Edge Cases", () => {
    it("should handle minimum limit boundary (1)", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.query = { limit: "1" };

      vi.mocked(prisma.comment.findUnique).mockResolvedValue({
        id: 1,
        content: "test content",
        parentId: null,
        postId: "abc",
        authorId: "def",
        createdAt: new Date(),
      });

      vi.mocked(prisma.comment.findMany).mockResolvedValue([mockReplies[0]]);
      vi.mocked(prisma.comment.count).mockResolvedValue(5);

      await getReplies(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(prisma.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 2, // limit + 1 for hasMore detection
        })
      );
    });

    it("should handle maximum limit boundary (40)", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.query = { limit: "40" };

      vi.mocked(prisma.comment.findUnique).mockResolvedValue({
        id: 1,
        content: "test content",
        parentId: null,
        postId: "abc",
        authorId: "def",
        createdAt: new Date(),
      });

      vi.mocked(prisma.comment.findMany).mockResolvedValue([]);
      vi.mocked(prisma.comment.count).mockResolvedValue(0);

      await getReplies(mockRequest, mockResponse);

      expect(prisma.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 41, // limit + 1 for hasMore detection
        })
      );
    });

    it("should handle cursor pointing to non-existent comment", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.query = { limit: "5", cursor: "999" };

      vi.mocked(prisma.comment.findUnique).mockResolvedValue({
        id: 1,
        content: "test content",
        parentId: null,
        postId: "abc",
        authorId: "def",
        createdAt: new Date(),
      });

      vi.mocked(prisma.comment.findMany).mockResolvedValue([]);
      vi.mocked(prisma.comment.count).mockResolvedValue(10);

      await getReplies(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: [],
        pagination: {
          nextCursor: null,
          hasMore: false,
          totalItems: 10,
        },
      });
    });

    it("should handle zero cursor value", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.query = { limit: "5", cursor: "0" };

      vi.mocked(prisma.comment.findUnique).mockResolvedValue({
        id: 1,
        content: "test content",
        parentId: null,
        postId: "abc",
        authorId: "def",
        createdAt: new Date(),
      });

      vi.mocked(prisma.comment.findMany).mockResolvedValue([]);
      vi.mocked(prisma.comment.count).mockResolvedValue(5);

      await getReplies(mockRequest, mockResponse);

      expect(prisma.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { parentId: 1 },
          take: 6,
          orderBy: { createdAt: "asc" },
        })
      );

      expect(prisma.comment.findMany).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it("should handle negative cursor value", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.query = { limit: "5", cursor: "-1" };

      vi.mocked(prisma.comment.findUnique).mockResolvedValue({
        id: 1,
        content: "test content",
        parentId: 5,
        postId: "abc",
        authorId: "def",
        createdAt: new Date(),
      });

      vi.mocked(prisma.comment.findMany).mockResolvedValue([]);
      vi.mocked(prisma.comment.count).mockResolvedValue(5);

      await getReplies(mockRequest, mockResponse);

      expect(prisma.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          cursor: { id: -1 },
          skip: 1,
        })
      );
    });
  });

  describe("Schema Validation Edge Cases", () => {
    it("should handle invalid limit parameter", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.query = { limit: "invalid" };

      await getReplies(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalled();
    });

    it("should handle zero limit", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.query = { limit: "0" };

      await getReplies(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalled();
    });

    it("should handle negative limit", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.query = { limit: "-5" };

      await getReplies(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalled();
    });

    it("should handle invalid cursor parameter", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.query = { cursor: "not-a-number" };

      await getReplies(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalled();
    });
  });

  describe("Large Dataset Scenarios", () => {
    it("should handle large result sets efficiently", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.query = { limit: "40" };

      const largeResultSet = Array.from({ length: 40 }, (_, i) => ({
        id: i + 1,
        content: `Reply ${i + 1}`,
        author: { id: `author${i}`, username: `user${i}`, avatarUrl: null },
        parentId: i + 1,
        postId: `Post ${i + 1}`,
        authorId: `author${i}`,
        createdAt: new Date(),
      }));

      vi.mocked(prisma.comment.findUnique).mockResolvedValue({
        id: 1,
        content: "test content",
        parentId: null,
        postId: "abc",
        authorId: "def",
        createdAt: new Date(),
      });

      vi.mocked(prisma.comment.findMany).mockResolvedValue(largeResultSet);
      vi.mocked(prisma.comment.count).mockResolvedValue(1000);

      await getReplies(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining(largeResultSet),
          pagination: expect.objectContaining({
            totalItems: 1000,
            hasMore: false, // Since we got exactly the limit
          }),
        })
      );
    });

    it("should handle empty result sets", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.query = {};

      vi.mocked(prisma.comment.findUnique).mockResolvedValue({
        id: 1,
        content: "test content",
        parentId: null,
        postId: "abc",
        authorId: "def",
        createdAt: new Date(),
      });

      vi.mocked(prisma.comment.findMany).mockResolvedValue([]);
      vi.mocked(prisma.comment.count).mockResolvedValue(0);

      await getReplies(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith({
        data: [],
        pagination: {
          nextCursor: null,
          hasMore: false,
          totalItems: 0,
        },
      });
    });
  });

  describe("Parent ID Edge Cases", () => {
    it("should handle very large parent ID numbers", async () => {
      const largeId = "9007199254740991"; // Max safe integer
      mockRequest.params = { id: largeId };
      mockRequest.query = {};

      vi.mocked(prisma.comment.findUnique).mockResolvedValue({
        id: 9007199254740991,
        content: "test content",
        parentId: null,
        postId: "abc",
        authorId: "def",
        createdAt: new Date(),
      });

      vi.mocked(prisma.comment.findMany).mockResolvedValue([]);
      vi.mocked(prisma.comment.count).mockResolvedValue(0);

      await getReplies(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(prisma.comment.findUnique).toHaveBeenCalledWith({
        where: { id: 9007199254740991 },
      });
    });

    it("should handle parent ID with leading zeros", async () => {
      mockRequest.params = { id: "00001" };
      mockRequest.query = {};

      vi.mocked(prisma.comment.findUnique).mockResolvedValue({
        id: 1,
        content: "test content",
        parentId: null,
        postId: "abc",
        authorId: "def",
        createdAt: new Date(),
      });

      vi.mocked(prisma.comment.findMany).mockResolvedValue([]);
      vi.mocked(prisma.comment.count).mockResolvedValue(0);

      await getReplies(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(prisma.comment.findUnique).toHaveBeenCalledWith({
        where: { id: 1 }, // Should be parsed as 1
      });
    });
  });
});
