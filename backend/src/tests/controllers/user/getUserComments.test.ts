import { getUserComments } from "../../../controllers/user.controller.js";
import prisma from "../../../core/config/db.js";
import { handleError } from "../../../core/error/index.js";
import { CommentWithRelations } from "../../../features/comments/commentService.js";

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

const mockUserComments: CommentWithRelations[] = [
  {
    id: 1,
    parentId: null,
    authorId: "user_987654321",
    postId: "post_456789123",
    content: "This is a great post! Thanks for sharing your insights.",
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    author: {
      id: "user_987654321",
      username: "john_doe",
      Avatar: { url: "https://example.com/avatars/john_doe.jpg" },
    },
    post: {
      id: "post_456789123",
      title: "Understanding Modern Web Development",
      content:
        "In today's rapidly evolving tech landscape, web development has become more complex and exciting than ever. From frameworks to deployment strategies, ...",
      author: { id: "user_111222333", username: "tech_blogger" },
    },
    parent: null,
  },
  {
    id: 2,
    parentId: 3,
    authorId: "user_987654321",
    postId: "post_789123456",
    content:
      "I completely agree with your point about React hooks. They've really simplified state management in functional components.",
    createdAt: new Date("2024-01-14T14:22:00.000Z"),
    author: {
      id: "user_987654321",
      username: "john_doe",
      Avatar: { url: "https://example.com/avatars/john_doe.jpg" },
    },
    post: {
      id: "post_789123456",
      title: "React Hooks Best Practices",
      content:
        "React hooks have revolutionized how we write components in React. In this comprehensive guide, ...",
      author: { id: "user_444555666", username: "react_expert" },
    },
    parent: {
      id: 3,
      content:
        "What do you think about the new useEffect patterns that have emerged recently? ...",
      author: { id: "user_777888999", username: "frontend_dev" },
    },
  },
];

describe("getUserComments Controller", () => {
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
    it("should return user comments with pagination", async () => {
      mockReq.params = { id: mockUser.id };
      mockReq.query = { limit: "10" };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.comment.findMany).mockResolvedValue(mockUserComments);

      await getUserComments(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(Number),
              content: expect.any(String),
              createdAt: expect.any(Date),
              isReply: expect.any(Boolean),
              author: expect.objectContaining({
                id: expect.any(String),
                username: expect.any(String),
                avatar: expect.objectContaining({
                  url: expect.any(String),
                }),
              }),
              post: expect.objectContaining({
                id: expect.any(String),
                title: expect.any(String),
                content: expect.any(String),
                author: expect.objectContaining({
                  id: expect.any(String),
                  username: expect.any(String),
                }),
              }),
            }),
          ]),
          pagination: expect.objectContaining({
            hasMore: expect.any(Boolean),
            nextCursor: expect.toSatisfy(
              (v) => v === null || typeof v === "number"
            ),
          }),
        })
      );
    });

    it("should return empty comments array for user with no comments", async () => {
      mockReq.params = { id: mockUser.id };
      mockReq.query = {};

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.comment.findMany).mockResolvedValue([]);

      await getUserComments(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        data: [],
        pagination: {
          hasMore: false,
          nextCursor: null,
        },
      });
    });

    it("should handle pagination parameters correctly", async () => {
      mockReq.params = { id: mockUser.id };
      mockReq.query = { limit: "1" };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.comment.findMany).mockResolvedValue(mockUserComments);

      await getUserComments(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.any(Array),
          pagination: {
            hasMore: expect.any(Boolean),
            nextCursor: expect.toSatisfy(
              (v) => v === null || typeof v === "number"
            ),
          },
        })
      );
    });
  });

  describe("Validation Errors", () => {
    it("should handle invalid user ID format", async () => {
      await expectValidationError(getUserComments, {
        params: { id: "invalid-id" },
      });
    });

    it("should handle missing user ID parameter", async () => {
      await expectValidationError(getUserComments, { params: {} });
    });

    it("should handle invalid pagination parameters", async () => {
      await expectValidationError(getUserComments, {
        params: { id: mockUser.id },
        query: { limit: "invalid", cursor: "not-valid" },
      });
    });

    it("should handle negative limit values", async () => {
      await expectValidationError(getUserComments, {
        params: { id: mockUser.id },
        query: { limit: "-5" },
      });
    });
  });

  describe("User Not Found Cases", () => {
    it("should return 404 when user does not exist", async () => {
      mockReq.params = { id: "834dff96-5ac6-4392-b9c0-1db5c3ccf767" };
      mockReq.query = {};

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await getUserComments(mockReq, mockRes);

      expect(prisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "834dff96-5ac6-4392-b9c0-1db5c3ccf767" },
        })
      );
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: expect.any(String),
      });
    });

    it("should not call comment service when user doesn't exist", async () => {
      mockReq.params = { id: "non-existent-user-id" };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await getUserComments(mockReq, mockRes);

      expect(prisma.comment.findMany).not.toHaveBeenCalled();
    });
  });

  describe("Database Errors", () => {
    it("should handle database connection errors during user lookup", async () => {
      mockReq.params = { id: mockUser.id };

      const dbError = new Error("Database connection failed");
      vi.mocked(prisma.user.findUnique).mockRejectedValue(dbError);

      await getUserComments(mockReq, mockRes);

      expect(handleError).toHaveBeenCalledWith(dbError, mockRes);
    });

    it("should handle database connection errors during comments lookup", async () => {
      mockReq.params = { id: mockUser.id };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      const dbError = new Error("Database connection failed");
      vi.mocked(prisma.comment.findMany).mockRejectedValue(dbError);

      await getUserComments(mockReq, mockRes);

      expect(handleError).toHaveBeenCalledWith(dbError, mockRes);
    });
  });

  describe("Response Format Validation", () => {
    it("should return response in correct format", async () => {
      mockReq.params = { id: mockUser.id };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.comment.findMany).mockResolvedValue(mockUserComments);

      await getUserComments(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.any(Array),
          pagination: expect.objectContaining({
            hasMore: expect.any(Boolean),
            nextCursor: expect.toSatisfy(
              (v) => v === null || typeof v === "number"
            ),
          }),
        })
      );
    });

    it("should include required comment fields in response", async () => {
      mockReq.params = { id: mockUser.id };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.comment.findMany).mockResolvedValue(mockUserComments);

      await getUserComments(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(Number),
              content: expect.any(String),
              createdAt: expect.any(Date),
              author: expect.any(Object),
              post: expect.any(Object),
              isReply: expect.any(Boolean),
            }),
          ]),
        })
      );
    });
  });
  describe("Edge Cases", () => {
    it("should set isReply=false whenever parentComment is null", async () => {
      mockReq.params = { id: mockUser.id };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.comment.findMany).mockResolvedValue(mockUserComments);

      await getUserComments(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const responseCall = vi.mocked(mockRes.json).mock.calls[0][0];

      responseCall.data
        .filter((c: any) => c.parentComment === null)
        .forEach((comment: any) => {
          expect(comment.isReply).toBe(false);
        });
    });

    it("should handle very long comment content", async () => {
      mockReq.params = { id: mockUser.id };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      const longComment = {
        ...mockUserComments[0],
        content: "A".repeat(2000),
      };

      vi.mocked(prisma.comment.findMany).mockResolvedValue([longComment]);

      await getUserComments(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);

      const responseCall = vi.mocked(mockRes.json).mock.calls[0][0];
      const firstComment = responseCall.data[0];

      expect(firstComment.content).toMatch(/^A+$/);
      expect(firstComment.content.length).toBe(2000);
    });
  });
});
