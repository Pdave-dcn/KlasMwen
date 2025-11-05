import { Request, Response } from "express";

import { getParentComments } from "../../../controllers/comment.controller";
import prisma from "../../../core/config/db";
import { handleError } from "../../../core/error";
import { PostNotFoundError } from "../../../core/error/custom/post.error";

import {
  createMockPost,
  createMockRequest,
  createMockResponse,
  mockComments,
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
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe("getParentComments controller", () => {
  let mockRequest: Request;
  let mockResponse: Response;

  const mockPostId = "6b2efb09-e634-41d9-b2eb-d4972fabb729";

  beforeEach(() => {
    mockRequest = createMockRequest();
    mockResponse = createMockResponse();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("Success Cases", () => {
    it("should return a list of comments with pagination data", async () => {
      mockRequest.params = { id: mockPostId };
      mockRequest.query = { limit: "2" };

      vi.mocked(prisma.post.findUnique).mockResolvedValue(
        createMockPost({ id: mockPostId })
      );

      vi.mocked(prisma.comment.findMany).mockResolvedValue(mockComments);
      vi.mocked(prisma.comment.count).mockResolvedValue(15);

      await getParentComments(mockRequest, mockResponse);

      expect(prisma.post.findUnique).toHaveBeenCalled();
      expect(prisma.comment.findMany).toHaveBeenCalled();
      expect(prisma.comment.count).toHaveBeenCalled();

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([expect.any(Object)]),
          pagination: {
            hasMore: expect.any(Boolean),
            nextCursor: expect.anything(),
            totalComments: expect.any(Number),
          },
        })
      );
    });

    it("should use default pagination when no query parameters provided", async () => {
      mockRequest.params = { id: mockPostId };
      mockRequest.query = {};

      vi.mocked(prisma.post.findUnique).mockResolvedValue(
        createMockPost({ id: mockPostId })
      );
      vi.mocked(prisma.comment.findMany).mockResolvedValue(mockComments);
      vi.mocked(prisma.comment.count).mockResolvedValue(3);

      await getParentComments(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: mockComments,
        pagination: {
          hasMore: false,
          nextCursor: null,
          totalComments: 3,
        },
      });
    });

    it("should return empty data when no parent comments exist", async () => {
      mockRequest.params = { id: mockPostId };
      mockRequest.query = { limit: "10" };

      vi.mocked(prisma.post.findUnique).mockResolvedValue(
        createMockPost({ id: mockPostId })
      );
      vi.mocked(prisma.comment.findMany).mockResolvedValue([]);
      vi.mocked(prisma.comment.count).mockResolvedValue(0);

      await getParentComments(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: [],
        pagination: {
          hasMore: false,
          nextCursor: null,
          totalComments: 0,
        },
      });
    });

    it("should handle maximum limit boundary (40)", async () => {
      mockRequest.params = { id: mockPostId };
      mockRequest.query = { limit: "40" };

      vi.mocked(prisma.post.findUnique).mockResolvedValue(
        createMockPost({ id: mockPostId })
      );
      vi.mocked(prisma.comment.findMany).mockResolvedValue(mockComments);
      vi.mocked(prisma.comment.count).mockResolvedValue(100);

      await getParentComments(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: mockComments,
        pagination: {
          hasMore: false,
          nextCursor: null,
          totalComments: 100,
        },
      });
    });

    it("should verify correct database queries are made", async () => {
      mockRequest.params = { id: mockPostId };
      mockRequest.query = { limit: "5" };

      vi.mocked(prisma.post.findUnique).mockResolvedValue(
        createMockPost({ id: mockPostId })
      );
      vi.mocked(prisma.comment.findMany).mockResolvedValue(mockComments);
      vi.mocked(prisma.comment.count).mockResolvedValue(10);

      await getParentComments(mockRequest, mockResponse);

      expect(prisma.post.findUnique).toHaveBeenCalledWith({
        where: { id: mockPostId },
        select: { id: true },
      });

      expect(prisma.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            postId: mockPostId,
            parentId: null,
          }),
        })
      );

      expect(prisma.comment.count).toHaveBeenCalledWith({
        where: { postId: mockPostId },
      });
    });
  });

  describe("Error Cases", () => {
    it("should call handleError when post does not exist", async () => {
      const nonExistentPostId = "550e8400-e29b-41d4-a716-446655440000";
      mockRequest.params = { id: nonExistentPostId };
      mockRequest.query = { limit: "10" };

      vi.mocked(prisma.post.findUnique).mockResolvedValue(null);

      await getParentComments(mockRequest, mockResponse);

      expect(prisma.post.findUnique).toHaveBeenCalledWith({
        where: { id: nonExistentPostId },
        select: { id: true },
      });
      expect(prisma.comment.findMany).not.toHaveBeenCalled();
      expect(prisma.comment.count).not.toHaveBeenCalled();
      expect(handleError).toHaveBeenCalledWith(
        expect.any(PostNotFoundError),
        mockResponse
      );
    });

    it("should handle invalid post ID parameter", async () => {
      mockRequest.params = {}; // Missing id parameter

      await getParentComments(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalled();
      expect(prisma.post.findUnique).not.toHaveBeenCalled();
    });

    it("should handle database error when checking post existence", async () => {
      mockRequest.params = { id: mockPostId };
      mockRequest.query = { limit: "10" };

      const dbError = new Error("Database connection failed");
      vi.mocked(prisma.post.findUnique).mockRejectedValue(dbError);

      await getParentComments(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalledWith(dbError, mockResponse);
    });

    it("should handle database error when fetching comments", async () => {
      mockRequest.params = { id: mockPostId };
      mockRequest.query = { limit: "10" };

      vi.mocked(prisma.post.findUnique).mockResolvedValue(
        createMockPost({ id: mockPostId })
      );

      const dbError = new Error("Failed to fetch comments");
      vi.mocked(prisma.comment.findMany).mockRejectedValue(dbError);

      await getParentComments(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalledWith(dbError, mockResponse);
    });
  });

  describe("Pagination Edge Cases", () => {
    it("should use default pagination when no query parameters provided", async () => {
      mockRequest.params = { id: mockPostId };
      mockRequest.query = {};

      vi.mocked(prisma.post.findUnique).mockResolvedValue(
        createMockPost({ id: mockPostId })
      );
      vi.mocked(prisma.comment.findMany).mockResolvedValue([]);
      vi.mocked(prisma.comment.count).mockResolvedValue(0);

      await getParentComments(mockRequest, mockResponse);

      expect(prisma.comment.findMany).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it("should handle maximum limit boundary", async () => {
      mockRequest.params = { id: mockPostId };
      mockRequest.query = { limit: "40" };

      vi.mocked(prisma.post.findUnique).mockResolvedValue(
        createMockPost({ id: mockPostId })
      );
      vi.mocked(prisma.comment.findMany).mockResolvedValue(mockComments);
      vi.mocked(prisma.comment.count).mockResolvedValue(5);

      await getParentComments(mockRequest, mockResponse);

      expect(prisma.comment.findMany).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it("should handle cursor-based pagination", async () => {
      mockRequest.params = { id: mockPostId };
      mockRequest.query = { limit: "5", cursor: "3" };

      const paginatedComments = mockComments.slice(0, 2);

      vi.mocked(prisma.post.findUnique).mockResolvedValue(
        createMockPost({ id: mockPostId })
      );
      vi.mocked(prisma.comment.findMany).mockResolvedValue(paginatedComments);
      vi.mocked(prisma.comment.count).mockResolvedValue(15);

      await getParentComments(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: paginatedComments,
        pagination: {
          hasMore: false,
          nextCursor: null,
          totalComments: 15,
        },
      });
    });

    it("should handle invalid pagination parameters", async () => {
      mockRequest.params = { id: mockPostId };
      mockRequest.query = { limit: "invalid", cursor: "not-a-number" };

      vi.mocked(prisma.post.findUnique).mockResolvedValue(
        createMockPost({ id: mockPostId })
      );

      await getParentComments(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalled();
    });

    it("should handle limit exceeding maximum allowed", async () => {
      mockRequest.params = { id: mockPostId };
      mockRequest.query = { limit: "50" };

      vi.mocked(prisma.post.findUnique).mockResolvedValue(
        createMockPost({ id: mockPostId })
      );

      await getParentComments(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalled();
    });
  });

  describe("Data Scenarios", () => {
    it("should return empty array when no comments exist for post", async () => {
      mockRequest.params = { id: mockPostId };
      mockRequest.query = { limit: "10" };

      vi.mocked(prisma.post.findUnique).mockResolvedValue(
        createMockPost({ id: mockPostId })
      );
      vi.mocked(prisma.comment.findMany).mockResolvedValue([]);
      vi.mocked(prisma.comment.count).mockResolvedValue(0);

      await getParentComments(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: [],
        pagination: {
          hasMore: false,
          nextCursor: null,
          totalComments: 0,
        },
      });
    });

    it("should return correct pagination when fewer comments than limit", async () => {
      mockRequest.params = { id: mockPostId };
      mockRequest.query = { limit: "10" };

      const twoComments = mockComments.slice(0, 2);

      vi.mocked(prisma.post.findUnique).mockResolvedValue(
        createMockPost({ id: mockPostId })
      );
      vi.mocked(prisma.comment.findMany).mockResolvedValue(twoComments);
      vi.mocked(prisma.comment.count).mockResolvedValue(2);

      await getParentComments(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: twoComments,
        pagination: {
          hasMore: false,
          nextCursor: null,
          totalComments: 2,
        },
      });
    });

    it("should verify only parent comments are fetched (parentId: null)", async () => {
      mockRequest.params = { id: mockPostId };
      mockRequest.query = { limit: "10" };

      vi.mocked(prisma.post.findUnique).mockResolvedValue(
        createMockPost({ id: mockPostId })
      );
      vi.mocked(prisma.comment.findMany).mockResolvedValue(mockComments);
      vi.mocked(prisma.comment.count).mockResolvedValue(3);

      await getParentComments(mockRequest, mockResponse);

      expect(prisma.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            postId: mockPostId,
            parentId: null,
          }),
        })
      );
    });
  });

  describe("Service Integration", () => {
    it("should handle service method returning correct structure", async () => {
      mockRequest.params = { id: mockPostId };
      mockRequest.query = { limit: "5" };

      vi.mocked(prisma.post.findUnique).mockResolvedValue(
        createMockPost({ id: mockPostId })
      );
      vi.mocked(prisma.comment.findMany).mockResolvedValue(mockComments);
      vi.mocked(prisma.comment.count).mockResolvedValue(10);

      await getParentComments(mockRequest, mockResponse);

      expect(prisma.comment.count).toHaveBeenCalledWith({
        where: { postId: mockPostId },
      });

      expect(mockResponse.json).toHaveBeenCalledWith({
        data: mockComments,
        pagination: {
          hasMore: false,
          nextCursor: null,
          totalComments: 10,
        },
      });
    });

    it("should properly call CommentService.getParentComments with correct parameters", async () => {
      const customLimit = 15;
      const customCursor = 25;

      mockRequest.params = { id: mockPostId };
      mockRequest.query = {
        limit: customLimit.toString(),
        cursor: customCursor.toString(),
      };

      vi.mocked(prisma.post.findUnique).mockResolvedValue(
        createMockPost({ id: mockPostId })
      );
      vi.mocked(prisma.comment.findMany).mockResolvedValue(mockComments);
      vi.mocked(prisma.comment.count).mockResolvedValue(20);

      await getParentComments(mockRequest, mockResponse);

      expect(prisma.comment.findMany).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });
});
