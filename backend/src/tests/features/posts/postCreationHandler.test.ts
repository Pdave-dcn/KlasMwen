import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockDeep, DeepMockProxy } from "vitest-mock-extended";

import prisma from "../../../core/config/db.js";
import handlePostCreation from "../../../features/posts/postCreationHandler";

import type { CreatePostInput, RawPost } from "../../../types/postTypes.js";
import type { PrismaClient, PostType } from "@prisma/client";

// Mock the entire prisma module
vi.mock("../../../core/config/db", () => ({
  default: mockDeep(),
}));

describe("handlePostCreation", () => {
  let prismaMock: DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    // Reset the mocks before each test
    prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
    vi.resetAllMocks();
  });

  const mockUserId = "test-user-id";
  const mockTagIds = [1, 2];
  const mockCreatedPostId = "test-post-id";

  // Mock post data for TEXT post without tags to return
  const mockTextPostReturnNoTags: RawPost = {
    id: mockCreatedPostId,
    title: "Test Post",
    content: "This is a test post.",
    type: "NOTE",
    fileUrl: null,
    fileName: null,
    fileSize: null,
    mimeType: null,
    createdAt: new Date(),
    author: {
      id: mockUserId,
      username: "testuser",
      Avatar: {
        id: 1,
        url: "http://example.com/avatar.jpg",
      },
    },
    postTags: [],
    _count: {
      comments: 0,
      likes: 0,
    },
  };

  // Mock post data for RESOURCE post with tags to return
  const mockResourcePostReturnWithTags: RawPost = {
    id: mockCreatedPostId,
    title: "Test Resource",
    content: null,
    type: "RESOURCE",
    fileUrl: "http://example.com/file.pdf",
    fileName: "file.pdf",
    fileSize: 1024,
    mimeType: "application/pdf",
    createdAt: new Date(),
    author: {
      id: mockUserId,
      username: "testuser",
      Avatar: {
        id: 2,
        url: "http://example.com/avatar2.jpg",
      },
    },
    postTags: [
      { postId: mockCreatedPostId, tagId: 1, tag: { id: 1, name: "tag1" } },
      { postId: mockCreatedPostId, tagId: 2, tag: { id: 2, name: "tag2" } },
    ],
    _count: {
      comments: 0,
      likes: 0,
    },
  };

  const mockPostData = {
    title: "Test Post",
    content: "This is a test post.",
    type: "NOTE" as PostType,
    fileUrl: null,
    fileName: null,
    fileSize: null,
    mimeType: null,
  };

  const mockResourcePostData = {
    title: "Test Resource",
    type: "RESOURCE" as PostType,
    content: null,
    fileUrl: "http://example.com/file.pdf",
    fileName: "file.pdf",
    fileSize: 1024,
    mimeType: "application/pdf",
  };

  it("should successfully create a TEXT post without tags", async () => {
    // Mock the $transaction block to execute immediately
    prismaMock.$transaction.mockImplementation(
      (callback: (tx: PrismaClient) => Promise<unknown>) => callback(prismaMock)
    );

    // Mock prisma.post.create to return a minimal post object
    prismaMock.post.create.mockResolvedValueOnce({
      id: mockCreatedPostId,
      ...mockPostData,
      authorId: mockUserId,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    // Mock prisma.post.findUnique to return the full post object, which matches the RawPost type
    prismaMock.post.findUnique.mockResolvedValueOnce(
      mockTextPostReturnNoTags as any
    );

    const postInput: CreatePostInput = {
      title: "Test Post",
      type: "NOTE",
      content: "This is a test post.",
      tagIds: [],
    };

    const result = await handlePostCreation(postInput, mockUserId);

    expect(prismaMock.post.create).toHaveBeenCalledWith({
      data: { ...mockPostData, authorId: mockUserId },
    });
    expect(prismaMock.postTag.createMany).not.toHaveBeenCalled();
    expect(prismaMock.post.findUnique).toHaveBeenCalledWith({
      where: { id: mockCreatedPostId },
      select: expect.any(Object),
    });
    // The final result should match the defined RawPost structure
    expect(result).toEqual(mockTextPostReturnNoTags);
  });

  it("should successfully create a RESOURCE post with tags", async () => {
    prismaMock.$transaction.mockImplementation(
      (callback: (tx: PrismaClient) => Promise<unknown>) => callback(prismaMock)
    );

    prismaMock.post.create.mockResolvedValueOnce({
      id: mockCreatedPostId,
      ...mockResourcePostData,
      authorId: mockUserId,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    // Mock prisma.postTag.createMany to resolve successfully
    prismaMock.postTag.createMany.mockResolvedValueOnce({
      count: mockTagIds.length,
    });

    prismaMock.post.findUnique.mockResolvedValueOnce(
      mockResourcePostReturnWithTags as any
    );

    const postInput: CreatePostInput = {
      title: "Test Resource",
      type: "RESOURCE",
      fileUrl: "http://example.com/file.pdf",
      fileName: "file.pdf",
      fileSize: 1024,
      mimeType: "application/pdf",
      tagIds: mockTagIds,
    };

    const result = await handlePostCreation(postInput, mockUserId);

    expect(prismaMock.post.create).toHaveBeenCalledWith({
      data: { ...mockResourcePostData, authorId: mockUserId },
    });
    expect(prismaMock.postTag.createMany).toHaveBeenCalledWith({
      data: mockTagIds.map((tagId) => ({
        postId: mockCreatedPostId,
        tagId,
      })),
    });
    expect(prismaMock.post.findUnique).toHaveBeenCalledWith({
      where: { id: mockCreatedPostId },
      select: expect.any(Object),
    });
    expect(result).toEqual(mockResourcePostReturnWithTags);
  });

  it("should rollback the transaction if PostTag creation fails", async () => {
    prismaMock.$transaction.mockImplementation(
      (callback: (tx: PrismaClient) => Promise<unknown>) => callback(prismaMock)
    );

    prismaMock.post.create.mockResolvedValueOnce({
      id: mockCreatedPostId,
      ...mockPostData,
      authorId: mockUserId,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    // Mock prisma.postTag.createMany to throw an error
    const mockError = new Error("Tag creation failed");
    prismaMock.postTag.createMany.mockRejectedValue(mockError);

    const postInput: CreatePostInput = {
      title: "Test Post",
      type: "NOTE",
      content: "This is a test post.",
      tagIds: mockTagIds,
    };

    // Expect the function call to reject with the error
    await expect(handlePostCreation(postInput, mockUserId)).rejects.toThrow(
      "Tag creation failed"
    );

    expect(prismaMock.post.create).toHaveBeenCalledWith({
      data: { ...mockPostData, authorId: mockUserId },
    });
    expect(prismaMock.postTag.createMany).toHaveBeenCalled();
    expect(prismaMock.post.findUnique).not.toHaveBeenCalled();
  });
});
