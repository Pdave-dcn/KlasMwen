import { describe, it, expect, vi, beforeEach } from "vitest";

import { PostCreationFailedError } from "../../../../src/core/error/custom/post.error.js";
import { PostNotFoundError } from "../../../../src/core/error/custom/post.error.js";
import { PostUpdateFailedError } from "../../../../src/core/error/custom/post.error.js";

const mockCreatePost = vi.fn();
const mockDelete = vi.fn();
const mockUpdatePost = vi.fn();
const mockFindPostForEdit = vi.fn();
const mockVerifyPostExists = vi.fn();
const mockValidateEditTimeWindow = vi.fn();
const mockCleanupFile = vi.fn();
const mockHandleResourceCleanup = vi.fn();
const mockTransformTagsToFlat = vi.fn();
const mockCreateEditResponse = vi.fn();

vi.mock(
  "../../../../src/features/posts/service/repositories/postRepository.js",
  () => ({
    postRepository: {
      command: {
        createPost: (...args: unknown[]) => mockCreatePost(...args),
        delete: (...args: unknown[]) => mockDelete(...args),
        updatePost: (...args: unknown[]) => mockUpdatePost(...args),
      },
      query: {
        findPostForEdit: (...args: unknown[]) => mockFindPostForEdit(...args),
      },
    },
  }),
);

vi.mock(
  "../../../../src/features/posts/service/core/PostValidationService.js",
  () => ({
    postValidationService: {
      verifyPostExists: (...args: unknown[]) => mockVerifyPostExists(...args),
      validateEditTimeWindow: (...args: unknown[]) =>
        mockValidateEditTimeWindow(...args),
    },
  }),
);

vi.mock(
  "../../../../src/features/posts/service/core/CloudinaryCleanupService.js",
  () => ({
    cloudinaryCleanupService: {
      cleanupFile: (...args: unknown[]) => mockCleanupFile(...args),
      handleResourceCleanup: (...args: unknown[]) =>
        mockHandleResourceCleanup(...args),
    },
  }),
);

vi.mock(
  "../../../../src/features/posts/service/transformers/postTransformers.js",
  () => ({
    postTransformer: {
      transformPost: (...args: unknown[]) => mockTransformTagsToFlat(...args),
      toEditResponse: (...args: unknown[]) => mockCreateEditResponse(...args),
    },
  }),
);

import { PostCommandService } from "../../../../src/features/posts/service/core/PostCommandService.js";

import type {
  CreatePostInput,
  UploadedFileInfo,
} from "../../../../src/features/posts/service/types/postTypes.js";

describe("PostCommandService", () => {
  let service: PostCommandService;
  const mockPermission = {
    assertCanDeletePost: vi.fn(),
    assertCanUpdatePost: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    service = new PostCommandService(
      { command: { createPost: mockCreatePost, delete: mockDelete, updatePost: mockUpdatePost }, query: { findPostForEdit: mockFindPostForEdit } } as any,
      { verifyPostExists: mockVerifyPostExists, validateEditTimeWindow: mockValidateEditTimeWindow } as any,
      { cleanupFile: mockCleanupFile, handleResourceCleanup: mockHandleResourceCleanup } as any,
      { transformPost: mockTransformTagsToFlat, toEditResponse: mockCreateEditResponse } as any,
      mockPermission as any,
    );
  });

  describe("createPost", () => {
    const input: CreatePostInput = {
      type: "NOTE",
      title: "Test Post",
      content: "Hello",
      tagIds: [1, 2],
    };

    it("should create a text post successfully", async () => {
      const createdPost = { id: "p1", title: "Test Post" };
      const transformed = { ...createdPost, tags: [{ id: 1, name: "tag1" }] };

      mockCreatePost.mockResolvedValue(createdPost);
      mockTransformTagsToFlat.mockReturnValue(transformed);

      const result = await service.createPost(input, "u1", null);

      expect(mockCreatePost).toHaveBeenCalledWith(input, "u1");
      expect(mockTransformTagsToFlat).toHaveBeenCalledWith(createdPost);
      expect(result).toBe(transformed);
    });

    it("should throw PostCreationFailedError and cleanup file on creation failure", async () => {
      const uploadedFile: UploadedFileInfo = {
        publicId: "cloud-id",
        secureUrl: "http://example.com/file.pdf",
      };

      mockCreatePost.mockResolvedValue(null);

      await expect(
        service.createPost(input, "u1", uploadedFile),
      ).rejects.toThrow(PostCreationFailedError);

      expect(mockCleanupFile).toHaveBeenCalledWith(
        "cloud-id",
        "PostCommandService.createPost",
      );
    });

    it("should not cleanup file on creation failure if no file uploaded", async () => {
      mockCreatePost.mockResolvedValue(null);

      await expect(
        service.createPost(input, "u1", null),
      ).rejects.toThrow(PostCreationFailedError);

      expect(mockCleanupFile).not.toHaveBeenCalled();
    });
  });

  describe("deletePost", () => {
    it("should delete a text post successfully", async () => {
      mockVerifyPostExists.mockResolvedValue({
        id: "p1",
        authorId: "u1",
        type: "NOTE",
        fileUrl: null,
        createdAt: new Date(),
      });

      await service.deletePost("p1", { id: "u1" } as any);

      expect(mockVerifyPostExists).toHaveBeenCalledWith("p1");
      expect(mockPermission.assertCanDeletePost).toHaveBeenCalled();
      expect(mockHandleResourceCleanup).not.toHaveBeenCalled();
      expect(mockDelete).toHaveBeenCalledWith("p1");
    });

    it("should cleanup Cloudinary file for resource posts", async () => {
      mockVerifyPostExists.mockResolvedValue({
        id: "p1",
        authorId: "u1",
        type: "RESOURCE",
        fileUrl: "http://example.com/file.pdf",
        createdAt: new Date(),
      });

      await service.deletePost("p1", { id: "u1" } as any);

      expect(mockHandleResourceCleanup).toHaveBeenCalledWith(
        "http://example.com/file.pdf",
        "PostCommandService.deletePost",
      );
      expect(mockDelete).toHaveBeenCalledWith("p1");
    });

    it("should throw PostNotFoundError when post does not exist", async () => {
      mockVerifyPostExists.mockRejectedValue(new PostNotFoundError("p1"));

      await expect(
        service.deletePost("p1", { id: "u1" } as any),
      ).rejects.toThrow(PostNotFoundError);

      expect(mockDelete).not.toHaveBeenCalled();
    });
  });

  describe("updatePost", () => {
    it("should update a text post successfully", async () => {
      const post = {
        id: "p1",
        authorId: "u1",
        type: "NOTE",
        fileUrl: null,
        createdAt: new Date(),
      };
      const updatedPost = { id: "p1", title: "Updated" };

      mockVerifyPostExists.mockResolvedValue(post);
      mockUpdatePost.mockResolvedValue(updatedPost);

      const result = await service.updatePost(
        {
          title: "Updated",
          type: "NOTE",
          content: "New content",
          tagIds: [1],
        },
        "p1",
        { id: "u1" } as any,
      );

      expect(mockVerifyPostExists).toHaveBeenCalledWith("p1");
      expect(mockPermission.assertCanUpdatePost).toHaveBeenCalled();
      expect(mockValidateEditTimeWindow).toHaveBeenCalledWith(
        post.createdAt,
        "p1",
      );
      expect(mockUpdatePost).toHaveBeenCalledWith(
        "p1",
        { title: "Updated", content: "New content" },
        [1],
      );
      expect(result).toBe(updatedPost);
    });

    it("should update a resource post (only title)", async () => {
      const post = {
        id: "p1",
        authorId: "u1",
        type: "RESOURCE",
        fileUrl: "http://example.com/file.pdf",
        createdAt: new Date(),
      };

      mockVerifyPostExists.mockResolvedValue(post);
      mockUpdatePost.mockResolvedValue({ id: "p1", title: "New Title" });

      await service.updatePost(
        { title: "New Title", type: "RESOURCE", tagIds: [] } as any,
        "p1",
        { id: "u1" } as any,
      );

      expect(mockUpdatePost).toHaveBeenCalledWith(
        "p1",
        { title: "New Title" },
        [],
      );
    });

    it("should throw PostUpdateFailedError when update returns null", async () => {
      const post = {
        id: "p1",
        authorId: "u1",
        type: "NOTE",
        fileUrl: null,
        createdAt: new Date(),
      };

      mockVerifyPostExists.mockResolvedValue(post);
      mockUpdatePost.mockResolvedValue(null);

      await expect(
        service.updatePost(
          { title: "Updated", type: "NOTE", tagIds: [] } as any,
          "p1",
          { id: "u1" } as any,
        ),
      ).rejects.toThrow(PostUpdateFailedError);
    });
  });

  describe("getPostForEdit", () => {
    it("should return edit response for existing post", async () => {
      const post = { id: "p1", title: "Test" };
      const transformed = { ...post, tags: [] };
      const editResponse = { data: transformed };

      mockFindPostForEdit.mockResolvedValue(post);
      mockTransformTagsToFlat.mockReturnValue(transformed);
      mockCreateEditResponse.mockReturnValue(editResponse);

      const result = await service.getPostForEdit(
        { id: "u1" } as any,
        "p1",
      );

      expect(mockFindPostForEdit).toHaveBeenCalledWith("p1");
      expect(mockPermission.assertCanUpdatePost).toHaveBeenCalled();
      expect(mockTransformTagsToFlat).toHaveBeenCalledWith(post);
      expect(mockCreateEditResponse).toHaveBeenCalledWith(transformed);
      expect(result).toBe(editResponse);
    });

    it("should throw PostNotFoundError when post does not exist", async () => {
      mockFindPostForEdit.mockResolvedValue(null);

      await expect(
        service.getPostForEdit({ id: "u1" } as any, "p1"),
      ).rejects.toThrow(PostNotFoundError);
    });
  });
});
