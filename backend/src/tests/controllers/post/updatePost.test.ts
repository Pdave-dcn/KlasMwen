import { Request, Response } from "express";

import { updatePost } from "../../../controllers/post.controller";
import prisma from "../../../core/config/db";
import { handleError } from "../../../core/error";
import {
  AuthenticationError,
  AuthorizationError,
} from "../../../core/error/custom/auth.error";

import { createAuthenticatedUser } from "./shared/helpers";
import { createMockRequest, createMockResponse } from "./shared/mocks";

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

vi.mock("../../../core/error/index.js", () => ({
  handleError: vi.fn(),
}));

vi.mock("../../../core/config/db.js", () => ({
  default: {
    post: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
    bookmark: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    like: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    postTag: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe("updatePost controller", () => {
  const mockUserId = "1";
  const mockPostId = "c377c8e9-d75d-4f16-9b57-1c64d2e8b2b7";

  let mockReq: Request;
  let mockRes: Response;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    vi.clearAllMocks();
  });

  const mockRequestData = {
    title: "Updated Title",
    content: "Updated Content",
    type: "NOTE" as const,
    tagIds: [1, 2],
  };

  const mockPostInDb = { id: mockPostId, authorId: mockUserId };

  const mockUpdateResult = {
    id: mockPostId,
    title: "Updated Title",
    content: "Updated Content",
    type: "NOTE",
    fileUrl: null,
    fileName: null,
    fileSize: null,
    mimeType: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    author: { id: mockUserId, username: "author", avatarUrl: null },
    postTags: [
      { postId: mockPostId, tagId: 1, tag: { id: 1, name: "tag1" } as any },
    ],
    _count: { comments: 0, likes: 0 },
  };

  describe("Successful Updates", () => {
    it("should successfully update a NOTE post with tags", async () => {
      mockReq.user = createAuthenticatedUser({ id: mockUserId });
      mockReq.params = { id: mockPostId };
      mockReq.body = mockRequestData;

      vi.mocked(prisma.post.findUnique).mockResolvedValue(mockPostInDb as any);

      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const tx = {
          post: {
            update: vi.fn().mockResolvedValue(undefined),
            findUnique: vi.fn().mockResolvedValue(mockUpdateResult),
          },
          postTag: {
            deleteMany: vi.fn().mockResolvedValue({ count: 2 }),
            createMany: vi.fn().mockResolvedValue({ count: 2 }),
          },
        };
        return await callback(tx as any);
      });

      await updatePost(mockReq, mockRes);

      expect(prisma.post.findUnique).toHaveBeenCalledWith({
        where: { id: mockPostId },
      });

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Post updated successfully",
        data: mockUpdateResult,
      });
    });

    it("should successfully update a RESOURCE post (title and fileName only, no content)", async () => {
      const resourceData = {
        title: "Updated Resource Title",
        type: "RESOURCE" as const,
        tagIds: [1],
        fileName: "updated-document.pdf",
      };

      const resourceResult = {
        ...mockUpdateResult,
        type: "RESOURCE",
        title: "Updated Resource Title",
        content: null,
        fileName: "updated-document.pdf",
      };

      mockReq.user = createAuthenticatedUser({ id: mockUserId });
      mockReq.params = { id: mockPostId };
      mockReq.body = resourceData;

      vi.mocked(prisma.post.findUnique).mockResolvedValue(mockPostInDb as any);

      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const tx = {
          post: {
            update: vi.fn((args) => {
              // Verify that content is NOT in update data for RESOURCE type
              expect(args.data).not.toHaveProperty("content");
              expect(args.data).toHaveProperty("title");
              return Promise.resolve(undefined);
            }),
            findUnique: vi.fn().mockResolvedValue(resourceResult),
          },
          postTag: {
            deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
            createMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
        };
        return await callback(tx as any);
      });

      await updatePost(mockReq, mockRes);

      expect(handleError).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Post updated successfully",
        data: resourceResult,
      });
    });

    it("should successfully update a post with empty tags array", async () => {
      const dataWithNoTags = {
        ...mockRequestData,
        tagIds: [],
      };

      const resultWithNoTags = {
        ...mockUpdateResult,
        postTags: [],
      };

      mockReq.user = createAuthenticatedUser({ id: mockUserId });
      mockReq.params = { id: mockPostId };
      mockReq.body = dataWithNoTags;

      vi.mocked(prisma.post.findUnique).mockResolvedValue(mockPostInDb as any);

      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const tx = {
          post: {
            update: vi.fn().mockResolvedValue(undefined),
            findUnique: vi.fn().mockResolvedValue(resultWithNoTags),
          },
          postTag: {
            deleteMany: vi.fn().mockResolvedValue({ count: 2 }),
            createMany: vi.fn(),
          },
        };
        const result = await callback(tx as any);

        // Verify createMany was NOT called when tagIds is empty
        expect(tx.postTag.createMany).not.toHaveBeenCalled();

        return result;
      });

      await updatePost(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Post updated successfully",
        data: resultWithNoTags,
      });
    });

    it("should successfully update a post with undefined tagIds", async () => {
      const dataWithUndefinedTags = {
        title: "Updated Title",
        content: "Updated Content",
        type: "NOTE" as const,
        tagIds: undefined,
      };

      mockReq.user = createAuthenticatedUser({ id: mockUserId });
      mockReq.params = { id: mockPostId };
      mockReq.body = dataWithUndefinedTags;

      vi.mocked(prisma.post.findUnique).mockResolvedValue(mockPostInDb as any);

      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const tx = {
          post: {
            update: vi.fn().mockResolvedValue(undefined),
            findUnique: vi.fn().mockResolvedValue(mockUpdateResult),
          },
          postTag: {
            deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
            createMany: vi.fn(),
          },
        };
        const result = await callback(tx as any);

        // Verify createMany was NOT called when tagIds is undefined
        expect(tx.postTag.createMany).not.toHaveBeenCalled();

        return result;
      });

      await updatePost(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe("Authentication & Authorization", () => {
    it("should call handleError with AuthenticationError when user is not authenticated", async () => {
      mockReq.params = { id: mockPostId };
      mockReq.body = mockRequestData;

      await updatePost(mockReq, mockRes);

      expect(handleError).toHaveBeenCalledWith(
        expect.any(AuthenticationError),
        mockRes
      );
    });

    it("should call handleError with AuthorizationError if the user is not the author", async () => {
      mockReq.user = createAuthenticatedUser();
      mockReq.params = { id: mockPostId };
      mockReq.body = mockRequestData;

      const mockPostInDbWithDifferentAuthor = {
        id: mockPostId,
        authorId: "some-other-author",
      };
      vi.mocked(prisma.post.findUnique).mockResolvedValue(
        mockPostInDbWithDifferentAuthor as any
      );

      await updatePost(mockReq, mockRes);

      expect(handleError).toHaveBeenCalledWith(
        expect.any(AuthorizationError),
        mockRes
      );
    });
  });

  describe("Not Found", () => {
    it("should return 404 if the post is not found", async () => {
      const mockMinimalBody = {
        title: "A valid title",
        content: "A valid content",
        type: "NOTE" as const,
        tagIds: [1, 2],
      };

      mockReq.user = createAuthenticatedUser({ id: mockUserId });
      mockReq.params = { id: "f34042c4-6143-4c8e-a790-49ba409529e8" };
      mockReq.body = mockMinimalBody;

      vi.mocked(prisma.post.findUnique).mockResolvedValue(null);

      await updatePost(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: "Post not found" });
    });
  });

  describe("Validation Errors", () => {
    it("should call handleError when title is missing", async () => {
      mockReq.user = createAuthenticatedUser({ id: mockUserId });
      mockReq.params = { id: mockPostId };
      mockReq.body = {
        content: "Updated Content",
        type: "NOTE",
        tagIds: [1, 2],
      };

      await updatePost(mockReq, mockRes);

      expect(handleError).toHaveBeenCalled();
    });

    it("should call handleError when type is invalid", async () => {
      mockReq.user = createAuthenticatedUser({ id: mockUserId });
      mockReq.params = { id: mockPostId };
      mockReq.body = {
        title: "Updated Title",
        content: "Updated Content",
        type: "INVALID_TYPE",
        tagIds: [1, 2],
      };

      await updatePost(mockReq, mockRes);

      expect(handleError).toHaveBeenCalled();
    });

    it("should call handleError when postId param is invalid", async () => {
      mockReq.user = createAuthenticatedUser({ id: mockUserId });
      mockReq.params = { id: "invalid-uuid" };
      mockReq.body = mockRequestData;

      await updatePost(mockReq, mockRes);

      expect(handleError).toHaveBeenCalled();
    });

    it("should call handleError when tagIds contains invalid values", async () => {
      mockReq.user = createAuthenticatedUser({ id: mockUserId });
      mockReq.params = { id: mockPostId };
      mockReq.body = {
        title: "Updated Title",
        content: "Updated Content",
        type: "NOTE",
        tagIds: ["invalid", "tags"],
      };

      await updatePost(mockReq, mockRes);

      expect(handleError).toHaveBeenCalled();
    });
  });

  describe("Database Transaction Errors", () => {
    it("should call handleError if post lookup fails", async () => {
      mockReq.user = createAuthenticatedUser({ id: mockUserId });
      mockReq.params = { id: mockPostId };
      mockReq.body = mockRequestData;

      const mockError = new Error("Database lookup error");
      vi.mocked(prisma.post.findUnique).mockRejectedValue(mockError);

      await updatePost(mockReq, mockRes);

      expect(handleError).toHaveBeenCalledWith(mockError, mockRes);
    });

    it("should call handleError if transaction fails", async () => {
      mockReq.user = createAuthenticatedUser({ id: mockUserId });
      mockReq.params = { id: mockPostId };
      mockReq.body = mockRequestData;

      const mockError = new Error("Database update error");

      vi.mocked(prisma.post.findUnique).mockResolvedValue(mockPostInDb as any);
      vi.mocked(prisma.$transaction).mockRejectedValue(mockError);

      await updatePost(mockReq, mockRes);

      expect(handleError).toHaveBeenCalledWith(mockError, mockRes);
    });

    it("should call handleError if post.update fails within transaction", async () => {
      mockReq.user = createAuthenticatedUser({ id: mockUserId });
      mockReq.params = { id: mockPostId };
      mockReq.body = mockRequestData;

      vi.mocked(prisma.post.findUnique).mockResolvedValue(mockPostInDb as any);

      const mockError = new Error("Update operation failed");
      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const tx = {
          post: {
            update: vi.fn().mockRejectedValue(mockError),
            findUnique: vi.fn(),
          },
          postTag: {
            deleteMany: vi.fn(),
            createMany: vi.fn(),
          },
        };
        return await callback(tx as any);
      });

      await updatePost(mockReq, mockRes);

      expect(handleError).toHaveBeenCalledWith(mockError, mockRes);
    });

    it("should call handleError if postTag.deleteMany fails within transaction", async () => {
      mockReq.user = createAuthenticatedUser({ id: mockUserId });
      mockReq.params = { id: mockPostId };
      mockReq.body = mockRequestData;

      vi.mocked(prisma.post.findUnique).mockResolvedValue(mockPostInDb as any);

      const mockError = new Error("Delete tags failed");
      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const tx = {
          post: {
            update: vi.fn().mockResolvedValue(undefined),
            findUnique: vi.fn(),
          },
          postTag: {
            deleteMany: vi.fn().mockRejectedValue(mockError),
            createMany: vi.fn(),
          },
        };
        return await callback(tx as any);
      });

      await updatePost(mockReq, mockRes);

      expect(handleError).toHaveBeenCalledWith(mockError, mockRes);
    });

    it("should call handleError if postTag.createMany fails within transaction", async () => {
      mockReq.user = createAuthenticatedUser({ id: mockUserId });
      mockReq.params = { id: mockPostId };
      mockReq.body = mockRequestData;

      vi.mocked(prisma.post.findUnique).mockResolvedValue(mockPostInDb as any);

      const mockError = new Error("Create tags failed");
      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const tx = {
          post: {
            update: vi.fn().mockResolvedValue(undefined),
            findUnique: vi.fn(),
          },
          postTag: {
            deleteMany: vi.fn().mockResolvedValue({ count: 2 }),
            createMany: vi.fn().mockRejectedValue(mockError),
          },
        };
        return await callback(tx as any);
      });

      await updatePost(mockReq, mockRes);

      expect(handleError).toHaveBeenCalledWith(mockError, mockRes);
    });
  });

  describe("Service Layer Errors", () => {
    it("should return 400 when PostService.handlePostUpdate returns null", async () => {
      mockReq.user = createAuthenticatedUser({ id: mockUserId });
      mockReq.params = { id: mockPostId };
      mockReq.body = mockRequestData;

      vi.mocked(prisma.post.findUnique).mockResolvedValue(mockPostInDb as any);

      // Mock transaction to return null
      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const tx = {
          post: {
            update: vi.fn().mockResolvedValue(undefined),
            findUnique: vi.fn().mockResolvedValue(null),
          },
          postTag: {
            deleteMany: vi.fn().mockResolvedValue({ count: 2 }),
            createMany: vi.fn().mockResolvedValue({ count: 2 }),
          },
        };
        return await callback(tx as any);
      });

      await updatePost(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Unexpected error: post update failed.",
      });
    });
  });

  describe("Transaction Atomicity", () => {
    it("should ensure all operations happen within a single transaction", async () => {
      mockReq.user = createAuthenticatedUser({ id: mockUserId });
      mockReq.params = { id: mockPostId };
      mockReq.body = mockRequestData;

      vi.mocked(prisma.post.findUnique).mockResolvedValue(mockPostInDb as any);

      const transactionCallback = vi.fn();
      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        transactionCallback();
        const tx = {
          post: {
            update: vi.fn().mockResolvedValue(undefined),
            findUnique: vi.fn().mockResolvedValue(mockUpdateResult),
          },
          postTag: {
            deleteMany: vi.fn().mockResolvedValue({ count: 2 }),
            createMany: vi.fn().mockResolvedValue({ count: 2 }),
          },
        };
        return await callback(tx as any);
      });

      await updatePost(mockReq, mockRes);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(transactionCallback).toHaveBeenCalledTimes(1);
    });

    it("should verify correct order of operations within transaction", async () => {
      mockReq.user = createAuthenticatedUser({ id: mockUserId });
      mockReq.params = { id: mockPostId };
      mockReq.body = mockRequestData;

      vi.mocked(prisma.post.findUnique).mockResolvedValue(mockPostInDb as any);

      const operationOrder: string[] = [];

      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const tx = {
          post: {
            update: vi.fn().mockImplementation(() => {
              operationOrder.push("update");
              return undefined;
            }),
            findUnique: vi.fn().mockImplementation(() => {
              operationOrder.push("findUnique");
              return mockUpdateResult;
            }),
          },
          postTag: {
            deleteMany: vi.fn().mockImplementation(() => {
              operationOrder.push("deleteMany");
              return { count: 2 };
            }),
            createMany: vi.fn().mockImplementation(() => {
              operationOrder.push("createMany");
              return { count: 2 };
            }),
          },
        };
        return await callback(tx as any);
      });

      await updatePost(mockReq, mockRes);

      // Verify operations happened in correct order: update, deleteMany, createMany, findUnique
      expect(operationOrder).toEqual([
        "update",
        "deleteMany",
        "createMany",
        "findUnique",
      ]);
    });
  });
});
