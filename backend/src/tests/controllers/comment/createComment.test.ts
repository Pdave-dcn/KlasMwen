import { Request, Response } from "express";

import { createComment } from "../../../controllers/comment.controller";
import prisma from "../../../core/config/db";
import { handleError } from "../../../core/error";
import { AuthenticationError } from "../../../core/error/custom/auth.error";
import {
  CommentNotFoundError,
  CommentPostMismatchError,
} from "../../../core/error/custom/comment.error";
import { PostNotFoundError } from "../../../core/error/custom/post.error";

import { createAuthenticatedUser } from "./shared/helpers";
import {
  createMockPost,
  createMockRequest,
  createMockResponse,
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

describe("createComment controller", () => {
  let mockRequest: Request;
  let mockResponse: Response;

  const mockPostId = "6b2efb09-e634-41d9-b2eb-d4972fabb729";
  const mockOtherPostId = "84e43802-23f1-4c7f-8713-85b1ac168dfa";
  const mockUserId1 = "910da3f7-f419-4929-b775-6e26ba17f248";
  const mockUserId2 = "60676309-9958-4a6a-b4bc-463199dab4ee";

  beforeEach(() => {
    mockRequest = createMockRequest();
    mockResponse = createMockResponse();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("Success Cases", () => {
    it("should create a new comment successfully when no parentId is provided", async () => {
      mockRequest.user = createAuthenticatedUser({ id: mockUserId1 });
      mockRequest.params = { id: mockPostId };
      mockRequest.body = { content: "This is a new comment." };

      vi.mocked(prisma.post.findUnique).mockResolvedValue(
        createMockPost({ id: mockPostId, authorId: mockUserId1 })
      );

      vi.mocked(prisma.comment.create).mockResolvedValue({
        id: 1,
        content: "This is a new comment.",
        authorId: mockUserId1,
        postId: mockPostId,
        parentId: null,
        createdAt: new Date(),
        mentionedUserId: null,
        hidden: false,
      });

      await createComment(mockRequest, mockResponse);

      expect(handleError).not.toHaveBeenCalled();

      expect(prisma.comment.create).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Comment created successfully",
        data: expect.objectContaining({
          id: 1,
          content: "This is a new comment.",
          authorId: mockUserId1,
          postId: mockPostId,
          parentId: null,
        }),
      });
    });

    it("should create a reply comment successfully when a valid parentId is provided", async () => {
      mockRequest.user = createAuthenticatedUser({ id: mockUserId1 });
      mockRequest.params = { id: mockPostId };
      mockRequest.body = { content: "This is a reply.", parentId: 2 };

      vi.mocked(prisma.post.findUnique).mockResolvedValue(
        createMockPost({ id: mockPostId, authorId: mockUserId1 })
      );

      vi.mocked(prisma.comment.findUnique).mockResolvedValue({
        id: 2,
        content: "Parent comment",
        authorId: mockUserId2,
        postId: mockPostId,
        parentId: null,
        createdAt: new Date(),
        mentionedUserId: null,
        hidden: false,
      });

      vi.mocked(prisma.comment.create).mockResolvedValue({
        id: 3,
        content: "This is a reply.",
        authorId: mockUserId1,
        postId: mockPostId,
        parentId: 2,
        createdAt: new Date(),
        mentionedUserId: null,
        hidden: false,
      });

      await createComment(mockRequest, mockResponse);

      expect(prisma.comment.create).toHaveBeenCalled();

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Comment created successfully",
        data: expect.objectContaining({
          id: 3,
          parentId: 2,
        }),
      });
    });
  });

  describe("Error Cases", () => {
    it("should call handleError with AuthenticationError when user is not authenticated", async () => {
      mockRequest.user = undefined;
      mockRequest.params = { id: mockPostId };
      mockRequest.body = { content: "Unauthorized comment." };

      await createComment(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalledWith(
        expect.any(AuthenticationError),
        mockResponse
      );
      expect(prisma.comment.create).not.toHaveBeenCalled();
    });

    it("should call handleError if the post does not exist", async () => {
      mockRequest.user = createAuthenticatedUser({ id: mockUserId1 });
      mockRequest.params = { id: mockPostId };
      mockRequest.body = { content: "Non-existent post comment." };

      vi.mocked(prisma.post.findUnique).mockResolvedValue(null);

      await createComment(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalledWith(
        expect.any(PostNotFoundError),
        mockResponse
      );
      expect(prisma.comment.create).not.toHaveBeenCalled();
    });

    it("should call handleError if parent comment does not exist when parentId is provided", async () => {
      mockRequest.user = createAuthenticatedUser({ id: mockUserId1 });
      mockRequest.params = { id: mockPostId };
      mockRequest.body = {
        content: "Reply to non-existent parent.",
        parentId: 999,
      };

      vi.mocked(prisma.post.findUnique).mockResolvedValue(
        createMockPost({ id: mockPostId, authorId: mockUserId1 })
      );

      vi.mocked(prisma.comment.findUnique).mockResolvedValue(null);

      await createComment(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalledWith(
        expect.any(CommentNotFoundError),
        mockResponse
      );
      expect(prisma.comment.create).not.toHaveBeenCalled();
    });

    it("should call handleError if parent comment belongs to a different post", async () => {
      mockRequest.user = createAuthenticatedUser({ id: mockUserId1 });
      mockRequest.params = { id: mockPostId };
      mockRequest.body = { content: "Reply to wrong post.", parentId: 2 };

      vi.mocked(prisma.post.findUnique).mockResolvedValue(
        createMockPost({ id: mockPostId, authorId: mockUserId1 })
      );

      vi.mocked(prisma.comment.findUnique).mockResolvedValue({
        id: 2,
        content: "Parent comment",
        authorId: mockUserId2,
        postId: mockOtherPostId,
        parentId: null,
        createdAt: new Date(),
        mentionedUserId: null,
        hidden: false,
      });

      await createComment(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalledWith(
        expect.any(CommentPostMismatchError),
        mockResponse
      );
      expect(prisma.comment.create).not.toHaveBeenCalled();
    });

    it("should call handleError for unexpected errors", async () => {
      mockRequest.user = createAuthenticatedUser({ id: mockUserId1 });
      mockRequest.params = { id: mockPostId };
      mockRequest.body = { content: "Error test." };

      const error = new Error("Database connection failed");
      vi.mocked(prisma.post.findUnique).mockRejectedValue(error);

      await createComment(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalledWith(error, mockResponse);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe("Input Validation", () => {
    it("should handle invalid request parameters (malformed postId)", async () => {
      mockRequest.user = createAuthenticatedUser({ id: mockUserId1 });
      mockRequest.params = { id: "invalid-uuid" }; // Invalid UUID format
      mockRequest.body = { content: "Test comment" };

      await createComment(mockRequest, mockResponse);

      // Should be caught by PostIdParamSchema.parse() and handled by handleError
      expect(handleError).toHaveBeenCalledWith(
        expect.any(Error), // ZodError from schema validation
        mockResponse
      );
      expect(prisma.post.findUnique).not.toHaveBeenCalled();
    });

    it("should handle invalid request body (empty content)", async () => {
      mockRequest.user = createAuthenticatedUser({ id: mockUserId1 });
      mockRequest.params = { id: mockPostId };
      mockRequest.body = { content: "" }; // Empty content (assuming schema validates this)

      await createComment(mockRequest, mockResponse);

      // Should be caught by CreateCommentSchema.parse() and handled by handleError
      expect(handleError).toHaveBeenCalledWith(
        expect.any(Error), // ZodError from schema validation
        mockResponse
      );
      expect(prisma.post.findUnique).not.toHaveBeenCalled();
    });

    it("should handle invalid request body (content too long)", async () => {
      mockRequest.user = createAuthenticatedUser({ id: mockUserId1 });
      mockRequest.params = { id: mockPostId };
      mockRequest.body = {
        content: "a".repeat(10000), // Assuming there's a max length validation
      };

      await createComment(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalledWith(
        expect.any(Error), // ZodError from schema validation
        mockResponse
      );
      expect(prisma.post.findUnique).not.toHaveBeenCalled();
    });

    it("should handle invalid parentId type", async () => {
      mockRequest.user = createAuthenticatedUser({ id: mockUserId1 });
      mockRequest.params = { id: mockPostId };
      mockRequest.body = {
        content: "Test comment",
        parentId: "invalid-parent-id", // Should be number, not string
      };

      await createComment(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalledWith(
        expect.any(Error), // ZodError from schema validation
        mockResponse
      );
      expect(prisma.post.findUnique).not.toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("should handle parentId of 0 (edge case for number validation)", async () => {
      mockRequest.user = createAuthenticatedUser({ id: mockUserId1 });
      mockRequest.params = { id: mockPostId };
      mockRequest.body = { content: "Test reply", parentId: 0 };

      vi.mocked(prisma.post.findUnique).mockResolvedValue(
        createMockPost({ id: mockPostId, authorId: mockUserId1 })
      );

      vi.mocked(prisma.comment.findUnique).mockResolvedValue(null);

      await createComment(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalled();
    });

    it("should handle negative parentId", async () => {
      mockRequest.user = createAuthenticatedUser({ id: mockUserId1 });
      mockRequest.params = { id: mockPostId };
      mockRequest.body = { content: "Test reply", parentId: -1 };

      vi.mocked(prisma.post.findUnique).mockResolvedValue(
        createMockPost({ id: mockPostId, authorId: mockUserId1 })
      );

      vi.mocked(prisma.comment.findUnique).mockResolvedValue(null);

      await createComment(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalled();
    });

    it("should handle special characters in content", async () => {
      const specialContent =
        "Comment with special chars: <script>alert('xss')</script> & émojis 🚀";

      mockRequest.user = createAuthenticatedUser({ id: mockUserId1 });
      mockRequest.params = { id: mockPostId };
      mockRequest.body = { content: specialContent };

      vi.mocked(prisma.post.findUnique).mockResolvedValue(
        createMockPost({ id: mockPostId, authorId: mockUserId1 })
      );

      vi.mocked(prisma.comment.create).mockResolvedValue({
        id: 1,
        content: specialContent,
        authorId: mockUserId1,
        postId: mockPostId,
        parentId: null,
        createdAt: new Date(),
        mentionedUserId: null,
        hidden: false,
      });

      await createComment(mockRequest, mockResponse);

      expect(prisma.comment.create).toHaveBeenCalledWith({
        data: {
          content: specialContent,
          author: { connect: { id: mockUserId1 } },
          post: { connect: { id: mockPostId } },
        },
      });

      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });

    it("should handle whitespace-only content", async () => {
      mockRequest.user = createAuthenticatedUser({ id: mockUserId1 });
      mockRequest.params = { id: mockPostId };
      mockRequest.body = { content: "   \n\t   " };

      await createComment(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalled();
    });
  });

  describe("Authentication Edge Cases", () => {
    it("should handle null user object", async () => {
      mockRequest.user = null as any;
      mockRequest.params = { id: mockPostId };
      mockRequest.body = { content: "Test comment" };

      await createComment(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalledWith(
        expect.any(AuthenticationError),
        mockResponse
      );
    });

    it("should handle user object with missing required fields", async () => {
      mockRequest.user = {
        /* missing id field */
      } as any;
      mockRequest.params = { id: mockPostId };
      mockRequest.body = { content: "Test comment" };

      await createComment(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalledWith(expect.any(Error), mockResponse);
    });
  });

  describe("Response Format Validation", () => {
    it("should return correct response structure for successful comment creation", async () => {
      mockRequest.user = createAuthenticatedUser({ id: mockUserId1 });
      mockRequest.params = { id: mockPostId };
      mockRequest.body = { content: "Test comment" };

      const mockCreatedComment = {
        id: 1,
        content: "Test comment",
        authorId: mockUserId1,
        postId: mockPostId,
        parentId: null,
        createdAt: new Date("2023-01-01T00:00:00Z"),
        mentionedUserId: null,
        hidden: false,
      };

      vi.mocked(prisma.post.findUnique).mockResolvedValue(
        createMockPost({ id: mockPostId, authorId: mockUserId1 })
      );

      vi.mocked(prisma.comment.create).mockResolvedValue(mockCreatedComment);

      await createComment(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Comment created successfully",
        data: mockCreatedComment,
      });
    });
  });
});
