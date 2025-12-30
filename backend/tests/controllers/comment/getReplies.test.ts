import { Request, Response } from "express";
import { ZodError } from "zod";

import { getReplies } from "../../../src/controllers/comment.controller";
import prisma from "../../../src/core/config/db";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMockRequest,
  createMockResponse,
  mockReplies,
} from "./shared/mocks";

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

vi.mock("../../../src/core/error/index", () => ({
  handleError: vi.fn(),
}));

vi.mock("../../../src/core/config/db.js", () => ({
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

const mockParentComment = {
  id: 1,
  content: "test content",
  parentId: null,
  postId: "abc",
  authorId: "def",
  createdAt: new Date(),
  mentionedUserId: null,
  hidden: false,
};

describe("getReplies controller", () => {
  let mockRequest: Request;
  let mockResponse: Response;
  let mockNext: any;

  beforeEach(() => {
    mockRequest = createMockRequest();
    mockNext = vi.fn();
    mockResponse = createMockResponse();
    vi.clearAllMocks();

    vi.mocked(prisma.comment.findUnique).mockResolvedValue(mockParentComment);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("Success Cases", () => {
    it("should return a list of replies with pagination data", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.query = { limit: "2" };

      vi.mocked(prisma.comment.findMany).mockResolvedValue(mockReplies);

      await getReplies(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: mockReplies.slice(0, 2),
        pagination: {
          nextCursor: 6,
          hasMore: true,
        },
      });

      expect(prisma.comment.findMany).toHaveBeenCalledTimes(1);
    });

    it("should return a list of replies with cursor", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.query = { limit: "2", cursor: "10" };

      const mockReplies2 = [
        {
          id: 9,
          content: "Reply after cursor",
          author: { id: "authorD", username: "userD", Avatar: null },
          createdAt: new Date(),
          parentId: 1,
          postId: "post123",
          authorId: "authorD",
          mentionedUserId: null,
          hidden: false,
        },
        {
          id: 8,
          content: "Another reply after cursor",
          author: { id: "authorE", username: "userE", Avatar: null },
          createdAt: new Date(),
          parentId: 1,
          postId: "post123",
          authorId: "authorE",
          mentionedUserId: null,
          hidden: false,
        },
      ];

      vi.mocked(prisma.comment.findMany).mockResolvedValue(mockReplies2);

      await getReplies(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: mockReplies2,
        pagination: {
          nextCursor: null,
          hasMore: false,
        },
      });

      expect(prisma.comment.findMany).toHaveBeenCalledTimes(1);

      expect(prisma.comment.findMany).toHaveBeenCalled();
    });

    it("should use default pagination values if none are provided", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.query = {};

      vi.mocked(prisma.comment.findMany).mockResolvedValue([]);

      await getReplies(mockRequest, mockResponse, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          pagination: expect.objectContaining({
            nextCursor: null,
            hasMore: false,
          }),
        })
      );
    });
  });

  describe("Error Cases", () => {
    it("should call handleError if the parent ID is not a number", async () => {
      mockRequest.params = { id: "abc" };
      mockRequest.query = {};

      await getReplies(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
      expect(prisma.comment.findMany).not.toHaveBeenCalled();
    });
  });

  describe("Pagination Edge Cases", () => {
    it("should handle minimum limit boundary (1)", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.query = { limit: "1" };

      vi.mocked(prisma.comment.findMany).mockResolvedValue([mockReplies[0]]);

      await getReplies(mockRequest, mockResponse, mockNext);

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

      vi.mocked(prisma.comment.findMany).mockResolvedValue([]);
      vi.mocked(prisma.comment.count).mockResolvedValue(0);

      await getReplies(mockRequest, mockResponse, mockNext);

      expect(prisma.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 41, // limit + 1 for hasMore detection
        })
      );
    });

    it("should handle cursor pointing to non-existent comment", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.query = { limit: "5", cursor: "999" };

      vi.mocked(prisma.comment.findMany).mockResolvedValue([]);

      await getReplies(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: [],
        pagination: {
          nextCursor: null,
          hasMore: false,
        },
      });
    });

    it("should handle zero cursor value", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.query = { limit: "5", cursor: "0" };

      vi.mocked(prisma.comment.findMany).mockResolvedValue([]);
      vi.mocked(prisma.comment.count).mockResolvedValue(5);

      await getReplies(mockRequest, mockResponse, mockNext);

      expect(prisma.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { parentId: 1, hidden: false },
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
        parentId: 5, // Custom parentId for this edge case
        postId: "abc",
        authorId: "def",
        createdAt: new Date(),
        mentionedUserId: null,
        hidden: false,
      });

      vi.mocked(prisma.comment.findMany).mockResolvedValue([]);
      vi.mocked(prisma.comment.count).mockResolvedValue(5);

      await getReplies(mockRequest, mockResponse, mockNext);

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

      await getReplies(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it("should handle zero limit", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.query = { limit: "0" };

      await getReplies(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it("should handle negative limit", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.query = { limit: "-5" };

      await getReplies(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it("should handle invalid cursor parameter", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.query = { cursor: "not-a-number" };

      await getReplies(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalled();
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
        createdAt: new Date(),
      }));

      vi.mocked(prisma.comment.findMany).mockResolvedValue(
        largeResultSet as any
      );

      await getReplies(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining(
            largeResultSet.map((item) =>
              expect.objectContaining({
                id: item.id,
                content: item.content,
                author: expect.objectContaining({
                  id: item.author.id,
                  username: item.author.username,
                }),
              })
            )
          ),
          pagination: {
            hasMore: false,
            nextCursor: null,
          },
        })
      );
    });

    it("should handle empty result sets", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.query = {};

      vi.mocked(prisma.comment.findMany).mockResolvedValue([]);

      await getReplies(mockRequest, mockResponse, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith({
        data: [],
        pagination: {
          nextCursor: null,
          hasMore: false,
        },
      });
    });
  });
});
