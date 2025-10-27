import { Request, Response } from "express";

import { createPost } from "../../../controllers/post/post.create.controller.js";
import { AuthenticationError } from "../../../core/error/custom/auth.error.js";
import { handleError } from "../../../core/error/index.js";
import { deleteFromCloudinary } from "../../../features/media/cloudinaryServices.js";
import handlePostCreation from "../../../features/posts/postCreationHandler.js";
import handleRequestValidation from "../../../features/posts/requestPostParser.js";
import {
  CreatePostInput,
  RawPost,
  TransformedPost,
} from "../../../types/postTypes.js";

import { createAuthenticatedUser } from "./shared/helpers.js";
import { createMockRequest, createMockResponse } from "./shared/mocks.js";

vi.mock("../../../features/posts/postCreationHandler.js");
vi.mock("../../../features/posts/requestPostParser.js");
vi.mock("../../../features/media/cloudinaryServices.js");

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

describe("createPost controller", () => {
  let mockReq: Request;
  let mockRes: Response;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();
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
    vi.mocked(handlePostCreation).mockResolvedValue(mockPostResult);

    await createPost(mockReq, mockRes);

    expect(handleRequestValidation).toHaveBeenCalledWith(
      mockReq,
      "60676309-9958-4a6a-b4bc-463199dab4ee"
    );
    expect(handlePostCreation).toHaveBeenCalledWith(
      mockValidatedData,
      "60676309-9958-4a6a-b4bc-463199dab4ee"
    );
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: "Post created successfully",
      data: mockTransformedPost,
    });
  });

  it("should call handleError with AuthenticationError when user is not authenticated", async () => {
    await createPost(mockReq, mockRes);

    expect(handleError).toHaveBeenCalledWith(
      expect.any(AuthenticationError),
      mockRes
    );
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
    vi.mocked(handlePostCreation).mockResolvedValue(null);

    await createPost(mockReq, mockRes);

    expect(handlePostCreation).toHaveBeenCalledWith(
      mockValidatedData,
      "60676309-9958-4a6a-b4bc-463199dab4ee"
    );
    expect(deleteFromCloudinary).toHaveBeenCalledWith(
      mockUploadedFileInfo.publicId,
      "raw"
    );
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: "Unexpected error: post creation failed.",
    });
  });

  it("should call handleError if validation fails", async () => {
    mockReq.user = createAuthenticatedUser();

    const mockValidationError = new Error("Invalid request");

    vi.mocked(handleRequestValidation).mockRejectedValue(mockValidationError);

    await createPost(mockReq, mockRes);

    expect(handleError).toHaveBeenCalledWith(mockValidationError, mockRes);
  });

  // NEW TESTS - Critical paths and edge cases

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
      vi.mocked(handlePostCreation).mockResolvedValue(null);

      await createPost(mockReq, mockRes);

      expect(deleteFromCloudinary).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Unexpected error: post creation failed.",
      });
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
      vi.mocked(handlePostCreation).mockResolvedValue(null);
      vi.mocked(deleteFromCloudinary).mockRejectedValue(
        new Error("Cloudinary deletion failed")
      );

      await createPost(mockReq, mockRes);

      expect(deleteFromCloudinary).toHaveBeenCalledWith(
        mockUploadedFileInfo.publicId,
        "raw"
      );
      // Should still return 500 even if cleanup fails
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Unexpected error: post creation failed.",
      });
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
      vi.mocked(handlePostCreation).mockResolvedValue(mockPostResult);

      await createPost(mockReq, mockRes);

      expect(handleRequestValidation).toHaveBeenCalledWith(
        mockReq,
        "60676309-9958-4a6a-b4bc-463199dab4ee"
      );
      expect(handlePostCreation).toHaveBeenCalledWith(
        mockValidatedData,
        "60676309-9958-4a6a-b4bc-463199dab4ee"
      );
      expect(deleteFromCloudinary).not.toHaveBeenCalled(); // Should not cleanup on success
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
      vi.mocked(handlePostCreation).mockResolvedValue(mockPostResult);

      await createPost(mockReq, mockRes);

      expect(handlePostCreation).toHaveBeenCalledWith(
        expect.objectContaining({
          tagIds: [1, 2, 3],
        }),
        "60676309-9958-4a6a-b4bc-463199dab4ee"
      );
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
      vi.mocked(handlePostCreation).mockResolvedValue(mockPostResult);

      await createPost(mockReq, mockRes);

      expect(handlePostCreation).toHaveBeenCalledWith(
        expect.objectContaining({
          tagIds: [],
        }),
        "60676309-9958-4a6a-b4bc-463199dab4ee"
      );
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
      vi.mocked(handlePostCreation).mockResolvedValue(mockPostResult);

      await createPost(mockReq, mockRes);

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
      vi.mocked(handlePostCreation).mockRejectedValue(dbError);

      await createPost(mockReq, mockRes);

      expect(handleError).toHaveBeenCalledWith(dbError, mockRes);
    });

    it("should handle non-Error objects thrown during validation", async () => {
      mockReq.user = createAuthenticatedUser();

      const unexpectedError = "String error message";

      vi.mocked(handleRequestValidation).mockRejectedValue(unexpectedError);

      await createPost(mockReq, mockRes);

      expect(handleError).toHaveBeenCalledWith(unexpectedError, mockRes);
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
      vi.mocked(handlePostCreation).mockResolvedValue(malformedPostResult);

      await createPost(mockReq, mockRes);

      expect(handleError).toHaveBeenCalled();
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
      vi.mocked(handlePostCreation).mockResolvedValue(mockPostResult);

      await createPost(mockReq, mockRes);

      expect(handlePostCreation).toHaveBeenCalledWith(
        expect.objectContaining({
          tagIds: [1, 2],
        }),
        "60676309-9958-4a6a-b4bc-463199dab4ee"
      );
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
      vi.mocked(handlePostCreation).mockResolvedValue(null);

      await createPost(mockReq, mockRes);

      expect(deleteFromCloudinary).toHaveBeenCalledWith(
        "failed_file_id",
        "raw"
      );
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Unexpected error: post creation failed.",
      });
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
      vi.mocked(handlePostCreation).mockResolvedValue(mockPostResult);

      await createPost(mockReq, mockRes);

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

    it("should return correctly structured error response on failure", async () => {
      mockReq.user = createAuthenticatedUser({
        id: "60676309-9958-4a6a-b4bc-463199dab4ee",
      });

      vi.mocked(handleRequestValidation).mockResolvedValue({
        completeValidatedData: {} as any,
        uploadedFileInfo: null,
      });
      vi.mocked(handlePostCreation).mockResolvedValue(null);

      await createPost(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("error"),
        })
      );
    });
  });
});
