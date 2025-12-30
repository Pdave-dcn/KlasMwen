import { Request, Response } from "express";

import { createPost } from "../../../src/controllers/post/post.create.controller.js";
import prisma from "../../../src/core/config/db.js";
import { AuthenticationError } from "../../../src/core/error/custom/auth.error.js";
import { PostCreationFailedError } from "../../../src/core/error/custom/post.error.js";
import CloudinaryService from "../../../src/features/media/CloudinaryService.js";
import handleRequestValidation from "../../../src/features/posts/requestPostParser.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CreatePostInput,
  RawPost,
  TransformedPost,
} from "../../../src/types/postTypes.js";

import { createAuthenticatedUser } from "./shared/helpers.js";
import { createMockRequest, createMockResponse } from "./shared/mocks.js";

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

vi.mock("../../../src/core/config/db.js", () => ({
  default: {
    $transaction: vi.fn(),
  },
}));

vi.mock("../../../src/features/posts/requestPostParser.js");
vi.mock("../../../src/features/media/CloudinaryService.js");

// Error handler mocks
vi.mock("../../../src/core/error/index.js", () => ({
  handleError: vi.fn(),
}));

describe("createPost controller", () => {
  let mockReq: Request;
  let mockRes: Response;
  let mockNext: any;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  it("should successfully create a post and return a 201 status", async () => {
    mockReq.user = createAuthenticatedUser({
      id: "60676309-9958-4a6a-b4bc-463199dab4ee",
    });

    const mockValidatedData: CreatePostInput = {
      title: "Test Title",
      content: "Test Content",
      type: "NOTE",
      tagIds: [],
    };

    const mockPostResult: RawPost = {
      id: "1",
      title: "Test Title",
      content: "Test Content",
      type: "NOTE",
      fileUrl: null,
      fileName: null,
      fileSize: null,
      mimeType: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      author: {
        id: "60676309-9958-4a6a-b4bc-463199dab4ee",
        username: "testUser",
        Avatar: { id: 2, url: "http://mock-url.com-avatar.svg" },
      },
      postTags: [],
      comments: [],
      _count: {
        comments: 0,
        likes: 0,
      },
    };

    const mockTransformedPost: TransformedPost = {
      id: "1",
      title: "Test Title",
      content: "Test Content",
      type: "NOTE",
      fileUrl: null,
      fileName: null,
      fileSize: null,
      mimeType: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      author: {
        id: "60676309-9958-4a6a-b4bc-463199dab4ee",
        username: "testUser",
        Avatar: { id: 2, url: "http://mock-url.com-avatar.svg" },
      },
      comments: [],
      _count: {
        comments: 0,
        likes: 0,
      },
      tags: [],
    };

    vi.mocked(handleRequestValidation).mockResolvedValue({
      completeValidatedData: mockValidatedData,
      uploadedFileInfo: null,
    });
    vi.mocked(prisma.$transaction).mockResolvedValue(mockPostResult);

    await createPost(mockReq, mockRes, mockNext);

    expect(handleRequestValidation).toHaveBeenCalledWith(
      mockReq,
      "60676309-9958-4a6a-b4bc-463199dab4ee"
    );
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function));

    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: "Post created successfully",
      data: mockTransformedPost,
    });
  });

  it("should return 500 and clean up the file if post creation fails", async () => {
    mockReq.user = createAuthenticatedUser({
      id: "60676309-9958-4a6a-b4bc-463199dab4ee",
    });

    const mockValidatedData = {
      title: "Test Title",
      content: "Test Content",
      type: "TEXT",
      tagIds: [],
    };
    const mockUploadedFileInfo = {
      publicId: "test_public_id",
      secureUrl: "test_url",
    };

    vi.mocked(handleRequestValidation).mockResolvedValue({
      completeValidatedData: mockValidatedData as any,
      uploadedFileInfo: mockUploadedFileInfo,
    });
    vi.mocked(prisma.$transaction).mockResolvedValue(null);

    await createPost(mockReq, mockRes, mockNext);

    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function));

    expect(CloudinaryService.delete).toHaveBeenCalledWith(
      mockUploadedFileInfo.publicId,
      "raw"
    );
    expect(mockNext).toHaveBeenCalledWith(expect.any(PostCreationFailedError));
  });

  it("should call handleError if validation fails", async () => {
    mockReq.user = createAuthenticatedUser();

    const mockValidationError = new Error("Invalid request");

    vi.mocked(handleRequestValidation).mockRejectedValue(mockValidationError);

    await createPost(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(mockValidationError);
  });

  describe("File cleanup on post creation failure", () => {
    it("should not attempt cleanup when no file was uploaded and post creation fails", async () => {
      mockReq.user = createAuthenticatedUser({
        id: "60676309-9958-4a6a-b4bc-463199dab4ee",
      });

      const mockValidatedData: CreatePostInput = {
        title: "Test Title",
        content: "Test Content",
        type: "NOTE",
        tagIds: [],
      };

      vi.mocked(handleRequestValidation).mockResolvedValue({
        completeValidatedData: mockValidatedData,
        uploadedFileInfo: null, // No file uploaded
      });
      vi.mocked(prisma.$transaction).mockResolvedValue(null);

      await createPost(mockReq, mockRes, mockNext);

      expect(CloudinaryService.delete).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(PostCreationFailedError));
    });

    it("should continue with error response even if file cleanup fails", async () => {
      mockReq.user = createAuthenticatedUser({
        id: "60676309-9958-4a6a-b4bc-463199dab4ee",
      });

      const mockValidatedData: CreatePostInput = {
        title: "Test Title",
        content: "Test Content",
        type: "NOTE",
        tagIds: [],
      };
      const mockUploadedFileInfo = {
        publicId: "test_public_id",
        secureUrl: "test_url",
      };

      vi.mocked(handleRequestValidation).mockResolvedValue({
        completeValidatedData: mockValidatedData,
        uploadedFileInfo: mockUploadedFileInfo,
      });
      vi.mocked(prisma.$transaction).mockResolvedValue(null);
      vi.mocked(CloudinaryService.delete).mockRejectedValue(
        new Error("Cloudinary deletion failed")
      );

      await createPost(mockReq, mockRes, mockNext);

      expect(CloudinaryService.delete).toHaveBeenCalledWith(
        mockUploadedFileInfo.publicId,
        "raw"
      );
      // Should still call handleError with PostCreationFailedError even if cleanup fails
      expect(mockNext).toHaveBeenCalledWith(expect.any(PostCreationFailedError));
    });
  });

  describe("Post creation with file uploads", () => {
    it("should successfully create a post with an uploaded file", async () => {
      mockReq.user = createAuthenticatedUser({
        id: "60676309-9958-4a6a-b4bc-463199dab4ee",
      });

      const mockValidatedData: CreatePostInput = {
        title: "Test Title with File",
        content: "Test Content",
        type: "NOTE",
        tagIds: [],
      };

      const mockUploadedFileInfo = {
        publicId: "test_public_id",
        secureUrl: "https://cloudinary.com/test_file.pdf",
      };

      const mockPostResult: RawPost = {
        id: "1",
        title: "Test Title with File",
        content: "Test Content",
        type: "NOTE",
        fileUrl: "https://cloudinary.com/test_file.pdf",
        fileName: "test_file.pdf",
        fileSize: 1024,
        mimeType: "application/pdf",
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {
          id: "60676309-9958-4a6a-b4bc-463199dab4ee",
          username: "testUser",
          Avatar: { id: 2, url: "http://mock-url.com-avatar.svg" },
        },
        postTags: [],
        comments: [],
        _count: {
          comments: 0,
          likes: 0,
        },
      };

      vi.mocked(handleRequestValidation).mockResolvedValue({
        completeValidatedData: mockValidatedData,
        uploadedFileInfo: mockUploadedFileInfo,
      });
      vi.mocked(prisma.$transaction).mockResolvedValue(mockPostResult);

      await createPost(mockReq, mockRes, mockNext);

      expect(handleRequestValidation).toHaveBeenCalledWith(
        mockReq,
        "60676309-9958-4a6a-b4bc-463199dab4ee"
      );
      expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function));

      expect(CloudinaryService.delete).not.toHaveBeenCalled(); // Should not cleanup on success
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Post created successfully",
        data: expect.objectContaining({
          id: "1",
          fileUrl: "https://cloudinary.com/test_file.pdf",
          fileName: "test_file.pdf",
        }),
      });
    });
  });

  describe("Post creation with tags", () => {
    it("should successfully create a post with multiple tags", async () => {
      mockReq.user = createAuthenticatedUser({
        id: "60676309-9958-4a6a-b4bc-463199dab4ee",
      });

      const mockValidatedData: CreatePostInput = {
        title: "Test Title",
        content: "Test Content",
        type: "NOTE",
        tagIds: [1, 2, 3],
      };

      const mockPostResult: RawPost = {
        id: "1",
        title: "Test Title",
        content: "Test Content",
        type: "NOTE",
        fileUrl: null,
        fileName: null,
        fileSize: null,
        mimeType: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {
          id: "60676309-9958-4a6a-b4bc-463199dab4ee",
          username: "testUser",
          Avatar: { id: 2, url: "http://mock-url.com-avatar.svg" },
        },
        postTags: [
          { postId: "1", tagId: 1, tag: { id: 1, name: "JavaScript" } },
          { postId: "1", tagId: 2, tag: { id: 2, name: "TypeScript" } },
          { postId: "1", tagId: 3, tag: { id: 3, name: "Testing" } },
        ],
        comments: [],
        _count: {
          comments: 0,
          likes: 0,
        },
      };

      vi.mocked(handleRequestValidation).mockResolvedValue({
        completeValidatedData: mockValidatedData,
        uploadedFileInfo: null,
      });
      vi.mocked(prisma.$transaction).mockResolvedValue(mockPostResult);

      await createPost(mockReq, mockRes, mockNext);

      expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function));

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("should successfully create a post with empty tags array", async () => {
      mockReq.user = createAuthenticatedUser({
        id: "60676309-9958-4a6a-b4bc-463199dab4ee",
      });

      const mockValidatedData: CreatePostInput = {
        title: "Test Title",
        content: "Test Content",
        type: "NOTE",
        tagIds: [],
      };

      const mockPostResult: RawPost = {
        id: "1",
        title: "Test Title",
        content: "Test Content",
        type: "NOTE",
        fileUrl: null,
        fileName: null,
        fileSize: null,
        mimeType: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {
          id: "60676309-9958-4a6a-b4bc-463199dab4ee",
          username: "testUser",
          Avatar: { id: 2, url: "http://mock-url.com-avatar.svg" },
        },
        postTags: [],
        comments: [],
        _count: {
          comments: 0,
          likes: 0,
        },
      };

      vi.mocked(handleRequestValidation).mockResolvedValue({
        completeValidatedData: mockValidatedData,
        uploadedFileInfo: null,
      });
      vi.mocked(prisma.$transaction).mockResolvedValue(mockPostResult);

      await createPost(mockReq, mockRes, mockNext);

      expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function));

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });

  describe("Different post types", () => {
    it.each([
      { type: "NOTE", description: "NOTE type post" },
      { type: "TEXT", description: "TEXT type post" },
      { type: "ARTICLE", description: "ARTICLE type post" },
    ])("should successfully create a $description", async ({ type }) => {
      mockReq.user = createAuthenticatedUser({
        id: "60676309-9958-4a6a-b4bc-463199dab4ee",
      });

      const mockValidatedData: CreatePostInput = {
        title: `Test ${type} Title`,
        content: "Test Content",
        type: type as any,
        tagIds: [],
      };

      const mockPostResult: RawPost = {
        id: "1",
        title: `Test ${type} Title`,
        content: "Test Content",
        type: type as any,
        fileUrl: null,
        fileName: null,
        fileSize: null,
        mimeType: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {
          id: "60676309-9958-4a6a-b4bc-463199dab4ee",
          username: "testUser",
          Avatar: { id: 2, url: "http://mock-url.com-avatar.svg" },
        },
        postTags: [],
        comments: [],
        _count: {
          comments: 0,
          likes: 0,
        },
      };

      vi.mocked(handleRequestValidation).mockResolvedValue({
        completeValidatedData: mockValidatedData,
        uploadedFileInfo: null,
      });
      vi.mocked(prisma.$transaction).mockResolvedValue(mockPostResult);

      await createPost(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Post created successfully",
        data: expect.objectContaining({
          type,
        }),
      });
    });
  });

  describe("Error handling edge cases", () => {
    it("should handle errors thrown during handlePostCreation", async () => {
      mockReq.user = createAuthenticatedUser({
        id: "60676309-9958-4a6a-b4bc-463199dab4ee",
      });

      const mockValidatedData: CreatePostInput = {
        title: "Test Title",
        content: "Test Content",
        type: "NOTE",
        tagIds: [],
      };

      const dbError = new Error("Database connection failed");

      vi.mocked(handleRequestValidation).mockResolvedValue({
        completeValidatedData: mockValidatedData,
        uploadedFileInfo: null,
      });
      vi.mocked(prisma.$transaction).mockRejectedValue(dbError);

      await createPost(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(dbError);
    });

    it("should handle non-Error objects thrown during validation", async () => {
      mockReq.user = createAuthenticatedUser();

      const unexpectedError = "String error message";

      vi.mocked(handleRequestValidation).mockRejectedValue(unexpectedError);

      await createPost(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(unexpectedError);
    });

    it("should handle errors in the transformation step", async () => {
      mockReq.user = createAuthenticatedUser({
        id: "60676309-9958-4a6a-b4bc-463199dab4ee",
      });

      const mockValidatedData: CreatePostInput = {
        title: "Test Title",
        content: "Test Content",
        type: "NOTE",
        tagIds: [],
      };

      const malformedPostResult = {
        id: "1",
        // Missing required fields that transformation expects
      } as any;

      vi.mocked(handleRequestValidation).mockResolvedValue({
        completeValidatedData: mockValidatedData,
        uploadedFileInfo: null,
      });
      vi.mocked(prisma.$transaction).mockResolvedValue(malformedPostResult);

      await createPost(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe("Complex scenarios", () => {
    it("should handle post creation with file and tags simultaneously", async () => {
      mockReq.user = createAuthenticatedUser({
        id: "60676309-9958-4a6a-b4bc-463199dab4ee",
      });

      const mockValidatedData: CreatePostInput = {
        title: "Complex Post",
        content: "Post with file and tags",
        type: "NOTE",
        tagIds: [1, 2],
      };

      const mockUploadedFileInfo = {
        publicId: "complex_file_id",
        secureUrl: "https://cloudinary.com/complex.pdf",
      };

      const mockPostResult: RawPost = {
        id: "1",
        title: "Complex Post",
        content: "Post with file and tags",
        type: "NOTE",
        fileUrl: "https://cloudinary.com/complex.pdf",
        fileName: "complex.pdf",
        fileSize: 2048,
        mimeType: "application/pdf",
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {
          id: "60676309-9958-4a6a-b4bc-463199dab4ee",
          username: "testUser",
          Avatar: { id: 2, url: "http://mock-url.com-avatar.svg" },
        },
        postTags: [
          { postId: "1", tagId: 1, tag: { id: 1, name: "JavaScript" } },
          { postId: "1", tagId: 2, tag: { id: 2, name: "TypeScript" } },
        ],
        comments: [],
        _count: {
          comments: 0,
          likes: 0,
        },
      };

      vi.mocked(handleRequestValidation).mockResolvedValue({
        completeValidatedData: mockValidatedData,
        uploadedFileInfo: mockUploadedFileInfo,
      });
      vi.mocked(prisma.$transaction).mockResolvedValue(mockPostResult);

      await createPost(mockReq, mockRes, mockNext);

      expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function));

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Post created successfully",
        data: expect.objectContaining({
          fileUrl: "https://cloudinary.com/complex.pdf",
        }),
      });
    });

    it("should properly cleanup file when post with file and tags fails", async () => {
      mockReq.user = createAuthenticatedUser({
        id: "60676309-9958-4a6a-b4bc-463199dab4ee",
      });

      const mockValidatedData: CreatePostInput = {
        title: "Failed Post",
        content: "This will fail",
        type: "NOTE",
        tagIds: [1, 2, 3],
      };

      const mockUploadedFileInfo = {
        publicId: "failed_file_id",
        secureUrl: "https://cloudinary.com/failed.pdf",
      };

      vi.mocked(handleRequestValidation).mockResolvedValue({
        completeValidatedData: mockValidatedData,
        uploadedFileInfo: mockUploadedFileInfo,
      });
      vi.mocked(prisma.$transaction).mockResolvedValue(null);
      vi.mocked(CloudinaryService.delete).mockResolvedValue();

      await createPost(mockReq, mockRes, mockNext);

      expect(CloudinaryService.delete).toHaveBeenCalledWith(
        "failed_file_id",
        "raw"
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(PostCreationFailedError));
    });
  });

  describe("Response structure validation", () => {
    it("should return correctly structured success response", async () => {
      mockReq.user = createAuthenticatedUser({
        id: "60676309-9958-4a6a-b4bc-463199dab4ee",
      });

      const mockValidatedData: CreatePostInput = {
        title: "Test Title",
        content: "Test Content",
        type: "NOTE",
        tagIds: [],
      };

      const mockPostResult: RawPost = {
        id: "1",
        title: "Test Title",
        content: "Test Content",
        type: "NOTE",
        fileUrl: null,
        fileName: null,
        fileSize: null,
        mimeType: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {
          id: "60676309-9958-4a6a-b4bc-463199dab4ee",
          username: "testUser",
          Avatar: { id: 2, url: "http://mock-url.com-avatar.svg" },
        },
        postTags: [],
        comments: [],
        _count: {
          comments: 0,
          likes: 0,
        },
      };

      vi.mocked(handleRequestValidation).mockResolvedValue({
        completeValidatedData: mockValidatedData,
        uploadedFileInfo: null,
      });
      vi.mocked(prisma.$transaction).mockResolvedValue(mockPostResult);

      await createPost(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String),
          data: expect.objectContaining({
            id: expect.any(String),
            title: expect.any(String),
            content: expect.any(String),
            type: expect.any(String),
            author: expect.any(Object),
          }),
        })
      );
    });
  });
});
