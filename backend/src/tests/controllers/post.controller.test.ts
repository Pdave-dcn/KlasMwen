import { PostType } from "@prisma/client";
import { vi, describe, it, expect, beforeEach } from "vitest";

import {
  createPost,
  getAllPosts,
  getPostById,
  getPostForEdit,
  updatePost,
  deletePost,
} from "../../controllers/post.controller.js";
import prisma from "../../core/config/db.js";
import { handleError } from "../../core/error/index.js";
import { handlePostWithCommentPagination } from "../../features/comments/commentPaginationHandler.js";
import {
  deleteFromCloudinary,
  extractPublicIdFromUrl,
} from "../../features/media/cloudinaryServices.js";
import createEditResponse from "../../features/posts/createEditResponse.js";
import handlePostCreation from "../../features/posts/postCreationHandler.js";
import transformPostTagsToFlat from "../../features/posts/postTagFlattener.js";
import handlePostUpdate from "../../features/posts/postUpdateHandler.js";
import handleRequestValidation from "../../features/posts/requestPostParser.js";
import {
  PostIdParamSchema,
  UpdatedPostSchema,
} from "../../zodSchemas/post.zod.js";

// Import all required types for a clean test setup
import type {
  CreatePostInput,
  RawPost,
  TransformedPost,
} from "../../types/postTypes.js";
import type { Request, Response } from "express";

vi.mock("../../core/config/db.js", () => ({
  default: {
    post: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}));
vi.mock("../../core/error/index.js");
vi.mock("../../features/posts/requestPostParser.js");
vi.mock("../../features/posts/postCreationHandler.js");
vi.mock("../../features/posts/postTagFlattener.js");
vi.mock("../../features/posts/createEditResponse.js");
vi.mock("../../features/posts/postUpdateHandler.js");
vi.mock("../../features/comments/commentPaginationHandler.js");
vi.mock("../../features/media/cloudinaryServices.js");
vi.mock("../../zodSchemas/post.zod.js");

const mockRequest = (user?: any, params?: any, query?: any, body?: any) =>
  ({
    user,
    params,
    query: query ?? {},
    body,
  } as unknown as Request);

const mockResponse = (): Response => {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

// Mock the Zod parse functions to correctly return the expected data
vi.mock("../../zodSchemas/post.zod.js", () => {
  const PostIdParamSchema = {
    parse: vi.fn((params) => ({ id: params.id })),
  };
  const UpdatedPostSchema = {
    parse: vi.fn((body) => ({
      ...body,
      tagIds: Array.isArray(body.tagIds)
        ? body.tagIds
        : JSON.parse(body.tagIds ?? "[]"),
    })),
  };
  return { PostIdParamSchema, UpdatedPostSchema };
});

describe("Post Controllers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createPost", () => {
    it("should successfully create a post and return a 201 status", async () => {
      const req = mockRequest({ id: 1, role: "STUDENT" });
      const res = mockResponse();

      // Ensure mock validated data conforms to the required type
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
          id: "1",
          username: "testuser",
          avatarUrl: null,
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
          id: "1",
          username: "testuser",
          avatarUrl: null,
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
      vi.mocked(transformPostTagsToFlat).mockReturnValue(mockTransformedPost);

      await createPost(req, res);

      expect(handleRequestValidation).toHaveBeenCalledWith(req, 1);
      expect(handlePostCreation).toHaveBeenCalledWith(mockValidatedData, 1);
      expect(transformPostTagsToFlat).toHaveBeenCalledWith(mockPostResult);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "Post create successfully",
        post: mockTransformedPost,
      });
    });

    it("should return 401 if the user is not authenticated", async () => {
      const req = mockRequest();
      const res = mockResponse();

      await createPost(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
      expect(handlePostCreation).not.toHaveBeenCalled();
    });

    it("should return 500 and clean up the file if post creation fails", async () => {
      const req = mockRequest({ id: 1, role: "USER" });
      const res = mockResponse();
      const mockValidatedData = {
        title: "Test Title",
        content: "Test Content",
        type: "TEXT",
        tagIds: [],
      };
      // Correct the mock uploaded file info to include 'secureUrl'
      const mockUploadedFileInfo = {
        publicId: "test_public_id",
        secureUrl: "test_url",
      };

      vi.mocked(handleRequestValidation).mockResolvedValue({
        completeValidatedData: mockValidatedData as any,
        uploadedFileInfo: mockUploadedFileInfo,
      });
      vi.mocked(handlePostCreation).mockResolvedValue(null);

      await createPost(req, res);

      expect(handlePostCreation).toHaveBeenCalledWith(mockValidatedData, 1);
      expect(deleteFromCloudinary).toHaveBeenCalledWith(
        mockUploadedFileInfo.publicId,
        "raw"
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Unexpected error: post creation failed.",
      });
    });

    it("should call handleError if validation fails", async () => {
      const req = mockRequest({ id: 1, role: "USER" });
      const res = mockResponse();
      const mockValidationError = new Error("Invalid request");

      vi.mocked(handleRequestValidation).mockRejectedValue(mockValidationError);

      await createPost(req, res);

      expect(handleError).toHaveBeenCalledWith(mockValidationError, res);
    });
  });

  // --- getAllPosts controller tests ---
  describe("getAllPosts", () => {
    it("should return a list of posts with default pagination", async () => {
      const req = mockRequest();
      const res = mockResponse();
      const mockPosts = [
        {
          id: 1,
          title: "Post 1",
          content: "Content 1",
          type: "NOTE",
          fileUrl: null,
          fileName: null,
          createdAt: new Date(),
          author: { id: 1, username: "testuser", avatarUrl: null },
          postTags: [{ tag: { name: "tag1" } }],
          _count: { comments: 0, likes: 0 },
        },
      ];
      const mockTransformedPosts = [
        {
          id: 1,
          title: "Post 1",
          content: "Content 1",
          type: "NOTE",
          fileUrl: null,
          fileName: null,
          createdAt: new Date(),
          author: { id: 1, username: "testuser", avatarUrl: null },
          tags: ["tag1"],
          _count: { comments: 0, likes: 0 },
        },
      ];

      vi.mocked(prisma.post.findMany).mockResolvedValue(mockPosts as any);
      vi.mocked(transformPostTagsToFlat).mockReturnValue(
        mockTransformedPosts[0] as any
      );

      await getAllPosts(req, res);

      expect(prisma.post.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        select: {
          id: true,
          title: true,
          content: true,
          type: true,
          fileUrl: true,
          fileName: true,
          createdAt: true,
          author: {
            select: { id: true, username: true, avatarUrl: true },
          },
          postTags: {
            include: { tag: true },
          },
          _count: {
            select: { comments: true, likes: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      expect(transformPostTagsToFlat).toHaveBeenCalledTimes(mockPosts.length);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockTransformedPosts);
    });

    it("should handle custom pagination parameters", async () => {
      const req = mockRequest(null, null, { page: "2", pageSize: "5" });
      const res = mockResponse();
      const mockPosts = [
        {
          id: 6,
          title: "Post 6",
          content: "Content 6",
          type: "NOTE",
          fileUrl: null,
          fileName: null,
          createdAt: new Date(),
          author: { id: 1, username: "testuser", avatarUrl: null },
          postTags: [],
          _count: { comments: 0, likes: 0 },
        },
      ];
      const mockTransformedPosts = [
        {
          id: 6,
          title: "Post 6",
          content: "Content 6",
          type: "NOTE",
          fileUrl: null,
          fileName: null,
          createdAt: new Date(),
          author: { id: 1, username: "testuser", avatarUrl: null },
          tags: [],
          _count: { comments: 0, likes: 0 },
        },
      ];

      vi.mocked(prisma.post.findMany).mockResolvedValue(mockPosts as any);
      vi.mocked(transformPostTagsToFlat).mockReturnValue(
        mockTransformedPosts[0] as any
      );

      await getAllPosts(req, res);

      expect(prisma.post.findMany).toHaveBeenCalledWith({
        skip: 5,
        take: 5,
        select: {
          id: true,
          title: true,
          content: true,
          type: true,
          fileUrl: true,
          fileName: true,
          createdAt: true,
          author: {
            select: { id: true, username: true, avatarUrl: true },
          },
          postTags: {
            include: { tag: true },
          },
          _count: {
            select: { comments: true, likes: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockTransformedPosts);
    });

    it("should call handleError if database query fails", async () => {
      const req = mockRequest();
      const res = mockResponse();
      const mockError = new Error("Database error");

      vi.mocked(prisma.post.findMany).mockRejectedValue(mockError);

      await getAllPosts(req, res);

      expect(handleError).toHaveBeenCalledWith(mockError, res);
    });
  });

  describe("getPostById", () => {
    it("should return a specific post with comments", async () => {
      const req = mockRequest(null, { id: "1" });
      const res = mockResponse();
      const mockPost = {
        id: 1,
        title: "Test",
        content: "Test content",
        type: "NOTE",
        fileUrl: null,
        fileName: null,
        fileSize: null,
        mimeType: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        author: { id: 1, username: "testuser", avatarUrl: null },
        postTags: [],
        comments: [
          {
            id: 1,
            content: "Comment 1",
            createdAt: new Date(),
            author: { id: 2, username: "commenter", avatarUrl: null },
          },
        ],
        _count: { comments: 1, likes: 0 },
      };
      const mockTransformedPost = {
        ...mockPost,
        hasMoreComments: false,
        nextCommentCursor: null,
      };

      vi.mocked(PostIdParamSchema.parse).mockReturnValue({ id: "1" } as any);
      vi.mocked(prisma.post.findUnique).mockResolvedValue(mockPost as any);
      vi.mocked(handlePostWithCommentPagination).mockReturnValue(
        mockTransformedPost as any
      );

      await getPostById(req, res);

      expect(PostIdParamSchema.parse).toHaveBeenCalledWith(req.params);
      expect(prisma.post.findUnique).toHaveBeenCalledWith({
        where: { id: "1" },
        select: {
          id: true,
          title: true,
          content: true,
          type: true,
          fileUrl: true,
          fileName: true,
          fileSize: true,
          mimeType: true,
          createdAt: true,
          updatedAt: true,
          author: {
            select: { id: true, username: true, avatarUrl: true },
          },
          postTags: {
            include: { tag: true },
          },
          comments: {
            select: {
              id: true,
              content: true,
              createdAt: true,
              author: {
                select: { id: true, username: true, avatarUrl: true },
              },
            },
            orderBy: { createdAt: "asc" },
            take: 21,
          },
          _count: {
            select: { comments: true, likes: true },
          },
        },
      });
      expect(handlePostWithCommentPagination).toHaveBeenCalledWith(
        mockPost,
        20
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockTransformedPost);
    });

    it("should handle custom comment pagination parameters", async () => {
      const req = mockRequest(
        null,
        { id: "1" },
        { commentLimit: "10", commentCursor: "5" }
      );
      const res = mockResponse();
      const mockPost = {
        id: 1,
        title: "Test",
        content: "Test content",
        type: "NOTE",
        fileUrl: null,
        fileName: null,
        fileSize: null,
        mimeType: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        author: { id: 1, username: "testuser", avatarUrl: null },
        postTags: [],
        comments: [],
        _count: { comments: 0, likes: 0 },
      };

      vi.mocked(PostIdParamSchema.parse).mockReturnValue({ id: "1" } as any);
      vi.mocked(prisma.post.findUnique).mockResolvedValue(mockPost as any);
      vi.mocked(handlePostWithCommentPagination).mockReturnValue(
        mockPost as any
      );

      await getPostById(req, res);

      expect(prisma.post.findUnique).toHaveBeenCalledWith({
        where: { id: "1" },
        select: {
          id: true,
          title: true,
          content: true,
          type: true,
          fileUrl: true,
          fileName: true,
          fileSize: true,
          mimeType: true,
          createdAt: true,
          updatedAt: true,
          author: {
            select: { id: true, username: true, avatarUrl: true },
          },
          postTags: {
            include: { tag: true },
          },
          comments: {
            select: {
              id: true,
              content: true,
              createdAt: true,
              author: {
                select: { id: true, username: true, avatarUrl: true },
              },
            },
            orderBy: { createdAt: "asc" },
            take: 11,
            cursor: { id: 5 },
            skip: 1,
          },
          _count: {
            select: { comments: true, likes: true },
          },
        },
      });

      expect(handlePostWithCommentPagination).toHaveBeenCalledWith(
        mockPost,
        10
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 404 if post is not found", async () => {
      const req = mockRequest(null, { id: "99" });
      const res = mockResponse();

      vi.mocked(PostIdParamSchema.parse).mockReturnValue({ id: "99" } as any);
      vi.mocked(prisma.post.findUnique).mockResolvedValue(null);

      await getPostById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Post not found" });
    });
  });

  describe("getPostForEdit", () => {
    const mockPostId = "1";
    const mockPost = {
      id: "1",
      title: "Test Post",
      content: "Content",
      type: "NOTE",
      fileUrl: null,
      fileName: null,
      fileSize: null,
      mimeType: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      author: { id: "1", username: "author", avatarUrl: null },
      authorId: "1",
      tags: [{ id: 2, name: "tag1" } as any],
      _count: { comments: 0, likes: 0 },
    };

    const mockEditResponse = {
      id: "1",
      title: "Test Post",
      content: "Content",
      type: "NOTE" as PostType,
      tags: [{ id: 2, name: "tag1" }],
      hasFile: false as const,
    };

    it("should return post data for editing if the user is the author", async () => {
      const req = mockRequest({ id: "1", role: "STUDENT" }, { id: mockPostId });
      const res = mockResponse();

      vi.mocked(PostIdParamSchema.parse).mockReturnValue({ id: mockPostId });
      vi.mocked(prisma.post.findUnique).mockResolvedValue(mockPost as any);
      vi.mocked(transformPostTagsToFlat).mockReturnValue(mockPost as any);
      vi.mocked(createEditResponse).mockReturnValue(mockEditResponse);

      await getPostForEdit(req, res);

      expect(PostIdParamSchema.parse).toHaveBeenCalledWith(req.params);
      expect(prisma.post.findUnique).toHaveBeenCalledWith(expect.anything());
      expect(transformPostTagsToFlat).toHaveBeenCalledWith(mockPost);
      expect(createEditResponse).toHaveBeenCalledWith(mockPost);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Post data for editing retrieved successfully",
        post: mockEditResponse,
      });
    });

    it("should return 401 if the user is not authenticated", async () => {
      const req = mockRequest(undefined, { id: mockPostId });
      const res = mockResponse();

      await getPostForEdit(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
    });

    it("should return 404 if the post is not found", async () => {
      const req = mockRequest({ id: "1", role: "STUDENT" }, { id: "99" });
      const res = mockResponse();

      vi.mocked(PostIdParamSchema.parse).mockReturnValue({ id: "99" });
      vi.mocked(prisma.post.findUnique).mockResolvedValue(null);

      await getPostForEdit(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Post not found" });
    });

    it("should return 403 if the user is not the author and not an ADMIN", async () => {
      const req = mockRequest({ id: "2", role: "STUDENT" }, { id: mockPostId });
      const res = mockResponse();

      vi.mocked(PostIdParamSchema.parse).mockReturnValue({ id: mockPostId });
      vi.mocked(prisma.post.findUnique).mockResolvedValue(mockPost as any);

      await getPostForEdit(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: "Unauthorized to edit this post",
      });
    });

    it("should allow an ADMIN user to edit any post", async () => {
      const req = mockRequest({ id: "2", role: "ADMIN" }, { id: mockPostId });
      const res = mockResponse();

      vi.mocked(PostIdParamSchema.parse).mockReturnValue({ id: mockPostId });
      vi.mocked(prisma.post.findUnique).mockResolvedValue(mockPost as any);
      vi.mocked(transformPostTagsToFlat).mockReturnValue(mockPost as any);
      vi.mocked(createEditResponse).mockReturnValue(mockEditResponse);

      await getPostForEdit(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Post data for editing retrieved successfully",
        post: mockEditResponse,
      });
    });

    it("should call handleError if a database query fails", async () => {
      const req = mockRequest({ id: "1", role: "STUDENT" }, { id: mockPostId });
      const res = mockResponse();
      const mockError = new Error("Database error");

      vi.mocked(PostIdParamSchema.parse).mockReturnValue({ id: mockPostId });
      vi.mocked(prisma.post.findUnique).mockRejectedValue(mockError);

      await getPostForEdit(req, res);

      expect(handleError).toHaveBeenCalledWith(mockError, res);
    });
  });

  describe("updatePost", () => {
    const mockUserId = "1";
    const mockPostId = "c377c8e9-d75d-4f16-9b57-1c64d2e8b2b7";

    // This data simulates what the controller RECEIVES from the HTTP request body
    const mockRequestData = {
      title: "Updated Title",
      content: "Updated Content",
      type: "NOTE" as const,
      // The controller expects tagIds as a JSON string
      tagIds: JSON.stringify([1, 2]),
    };

    // This data simulates what the Zod parser RETURNS after validation
    const mockValidatedData = {
      title: "Updated Title",
      content: "Updated Content",
      type: "NOTE" as const,
      tagIds: [1, 2],
    };

    // Mock object representing a post found in the database
    const mockPostInDb = { id: mockPostId, authorId: mockUserId };

    // Mock object representing the final result after a successful update
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
      comments: [],
      _count: { comments: 0, likes: 0 },
    };

    it("should successfully update a post if the user is the author", async () => {
      const req = mockRequest(
        { id: mockUserId },
        { id: mockPostId },
        undefined,
        mockRequestData
      );
      const res = mockResponse();

      vi.mocked(PostIdParamSchema.parse).mockReturnValue({ id: mockPostId });
      vi.mocked(UpdatedPostSchema.parse).mockReturnValue(
        mockValidatedData as any
      );
      vi.mocked(prisma.post.findUnique).mockResolvedValue(mockPostInDb as any);
      vi.mocked(handlePostUpdate).mockResolvedValue(mockUpdateResult as any);

      await updatePost(req, res);

      expect(PostIdParamSchema.parse).toHaveBeenCalledWith(req.params);
      expect(UpdatedPostSchema.parse).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Updated Title" })
      );
      expect(prisma.post.findUnique).toHaveBeenCalledWith({
        where: { id: mockPostId },
      });
      expect(handlePostUpdate).toHaveBeenCalledWith(
        mockValidatedData,
        mockPostId
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Post update successfully",
        post: mockUpdateResult,
      });
    });

    it("should return 401 if the user is not authenticated", async () => {
      const req = mockRequest(undefined, { id: mockPostId });
      const res = mockResponse();

      await updatePost(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
    });

    it("should return 404 if the post is not found", async () => {
      // Correctly formatted mock body
      const mockMinimalBody = {
        title: "A valid title",
        content: "A valid content",
        type: "NOTE" as const,
        tagIds: JSON.stringify([1, 2]),
      };

      const req = mockRequest(
        { id: mockUserId },
        { id: "99" },
        undefined,
        mockMinimalBody
      );
      const res = mockResponse();

      vi.mocked(PostIdParamSchema.parse).mockReturnValue({ id: "99" });
      vi.mocked(UpdatedPostSchema.parse).mockReturnValue({
        ...mockMinimalBody,
        tagIds: [1, 2],
      });
      vi.mocked(prisma.post.findUnique).mockResolvedValue(null);

      await updatePost(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Post not found" });
    });

    it("should return 403 if the user is not the author", async () => {
      const req = mockRequest(
        { id: "different-user" },
        { id: mockPostId },
        undefined,
        mockRequestData // Correctly using mockRequestData
      );
      const res = mockResponse();

      vi.mocked(PostIdParamSchema.parse).mockReturnValue({ id: mockPostId });
      vi.mocked(UpdatedPostSchema.parse).mockReturnValue(mockValidatedData);

      const mockPostInDbWithDifferentAuthor = {
        id: mockPostId,
        authorId: "some-other-author",
      };
      vi.mocked(prisma.post.findUnique).mockResolvedValue(
        mockPostInDbWithDifferentAuthor as any
      );

      await updatePost(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: "Forbidden" });
    });

    it("should call handleError if a database operation fails", async () => {
      const req = mockRequest(
        { id: mockUserId },
        { id: mockPostId },
        undefined,
        mockRequestData // Correctly using mockRequestData
      );
      const res = mockResponse();
      const mockError = new Error("Database update error");

      vi.mocked(PostIdParamSchema.parse).mockReturnValue({ id: mockPostId });
      vi.mocked(UpdatedPostSchema.parse).mockReturnValue(mockValidatedData);
      vi.mocked(prisma.post.findUnique).mockResolvedValue(mockPostInDb as any);
      vi.mocked(handlePostUpdate).mockRejectedValue(mockError);

      await updatePost(req, res);

      expect(handleError).toHaveBeenCalledWith(mockError, res);
    });
  });

  describe("deletePost", () => {
    const mockPostId = "1";
    const mockUserId = "1";
    const mockPostInDb = { id: mockPostId, authorId: mockUserId };
    const mockResourcePostInDb = {
      ...mockPostInDb,
      type: "RESOURCE",
      fileUrl: "http://cloudinary.com/image/upload/v12345/publicId.jpg",
    };

    it("should successfully delete a post if the user is the author", async () => {
      const req = mockRequest({ id: mockUserId }, { id: mockPostId });
      const res = mockResponse();

      vi.mocked(PostIdParamSchema.parse).mockReturnValue({ id: mockPostId });
      vi.mocked(prisma.post.findUnique).mockResolvedValue(mockPostInDb as any);
      vi.mocked(prisma.post.delete).mockResolvedValue(mockPostInDb as any);

      await deletePost(req, res);

      expect(PostIdParamSchema.parse).toHaveBeenCalledWith(req.params);
      expect(prisma.post.findUnique).toHaveBeenCalledWith({
        where: { id: mockPostId },
      });
      expect(deleteFromCloudinary).not.toHaveBeenCalled();
      expect(prisma.post.delete).toHaveBeenCalledWith({
        where: { id: mockPostId },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Post delete successfully",
      });
    });

    it("should successfully delete a post and its file if it is a RESOURCE type", async () => {
      const req = mockRequest({ id: mockUserId }, { id: mockPostId });
      const res = mockResponse();

      vi.mocked(PostIdParamSchema.parse).mockReturnValue({ id: mockPostId });
      vi.mocked(prisma.post.findUnique).mockResolvedValue(
        mockResourcePostInDb as any
      );
      vi.mocked(extractPublicIdFromUrl).mockReturnValue("publicId");
      //vi.mocked(deleteFromCloudinary).mockResolvedValue(true);
      vi.mocked(prisma.post.delete).mockResolvedValue(
        mockResourcePostInDb as any
      );

      await deletePost(req, res);

      expect(extractPublicIdFromUrl).toHaveBeenCalledWith(
        mockResourcePostInDb.fileUrl
      );
      expect(deleteFromCloudinary).toHaveBeenCalledWith("publicId", "raw");
      expect(prisma.post.delete).toHaveBeenCalledWith({
        where: { id: mockPostId },
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 401 if the user is not authenticated", async () => {
      const req = mockRequest(undefined, { id: mockPostId });
      const res = mockResponse();

      await deletePost(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
    });

    it("should return 404 if the post is not found", async () => {
      const req = mockRequest({ id: mockUserId }, { id: "99" });
      const res = mockResponse();

      vi.mocked(PostIdParamSchema.parse).mockReturnValue({ id: "99" });
      vi.mocked(prisma.post.findUnique).mockResolvedValue(null);

      await deletePost(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Post not found" });
    });

    it("should return 409 if the user is not the author and not an ADMIN", async () => {
      const req = mockRequest({ id: "different-user" }, { id: mockPostId });
      const res = mockResponse();

      vi.mocked(PostIdParamSchema.parse).mockReturnValue({ id: mockPostId });
      vi.mocked(prisma.post.findUnique).mockResolvedValue(mockPostInDb as any);

      await deletePost(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
    });

    it("should allow an ADMIN user to delete any post", async () => {
      const req = mockRequest(
        { id: "different-user", role: "ADMIN" },
        { id: mockPostId }
      );
      const res = mockResponse();

      vi.mocked(PostIdParamSchema.parse).mockReturnValue({ id: mockPostId });
      vi.mocked(prisma.post.findUnique).mockResolvedValue(mockPostInDb as any);
      vi.mocked(prisma.post.delete).mockResolvedValue(mockPostInDb as any);

      await deletePost(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Post delete successfully",
      });
    });

    it("should call handleError if a database operation fails", async () => {
      const req = mockRequest({ id: mockUserId }, { id: mockPostId });
      const res = mockResponse();
      const mockError = new Error("Database delete error");

      vi.mocked(PostIdParamSchema.parse).mockReturnValue({ id: mockPostId });
      vi.mocked(prisma.post.findUnique).mockResolvedValue(mockPostInDb as any);
      vi.mocked(prisma.post.delete).mockRejectedValue(mockError);

      await deletePost(req, res);

      expect(handleError).toHaveBeenCalledWith(mockError, res);
    });
  });
});
