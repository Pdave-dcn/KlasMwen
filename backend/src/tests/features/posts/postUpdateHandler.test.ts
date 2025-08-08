import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockDeep, DeepMockProxy } from "vitest-mock-extended";

import prisma from "../../../core/config/db.js";
import handlePostUpdate from "../../../features/posts/postUpdateHandler";

import type { RawPost } from "../../../types/postTypes.js";
import type { PrismaClient } from "@prisma/client";

vi.mock("../../../core/config/db", () => ({
  default: mockDeep(),
}));

type ValidatedData =
  | {
      title: string;
      tagIds: number[];
      type: "QUESTION" | "NOTE";
      content: string;
    }
  | {
      title: string;
      tagIds: number[];
      type: "RESOURCE";
      fileName: string;
    };

describe("handlePostUpdate", () => {
  let prismaMock: DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
    vi.resetAllMocks();
  });

  const mockPostId = "test-post-id";
  const mockUserId = "test-user-id";
  const mockExistingTagIds = [1, 2];
  const mockNewTagIds = [3, 4];
  const combinedTagIds = [...mockExistingTagIds, ...mockNewTagIds];

  const mockExistingPost: RawPost = {
    id: mockPostId,
    title: "Original Post Title",
    content: "Original post content.",
    type: "NOTE",
    fileUrl: null,
    fileName: null,
    fileSize: null,
    mimeType: null,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    author: {
      id: mockUserId,
      username: "testuser",
      avatarUrl: "http://example.com/avatar.jpg",
    },
    postTags: [
      { postId: mockPostId, tagId: 1, tag: { id: 1, name: "tag1" } },
      { postId: mockPostId, tagId: 2, tag: { id: 2, name: "tag2" } },
    ],
    _count: { comments: 0, likes: 0 },
  };

  const mockExistingResourcePost: RawPost = {
    ...mockExistingPost,
    content: null,
    type: "RESOURCE",
    title: "Original Resource Title",
    fileName: "original_file.pdf",
    fileUrl: "http://example.com/original_file.pdf",
    fileSize: 512,
    mimeType: "application/pdf",
  };

  it("should successfully update a NOTE post and add new tags", async () => {
    // Mock the $transaction block
    prismaMock.$transaction.mockImplementation(
      (callback: (tx: PrismaClient) => Promise<unknown>) => callback(prismaMock)
    );

    prismaMock.post.update.mockResolvedValueOnce({
      ...mockExistingPost,
      title: "Updated Post Title",
      content: "Updated post content.",
      updatedAt: new Date(),
      authorId: mockUserId,
    });

    prismaMock.postTag.deleteMany.mockResolvedValueOnce({
      count: mockExistingTagIds.length,
    });

    prismaMock.postTag.createMany.mockResolvedValueOnce({
      count: combinedTagIds.length,
    });

    // Mock prisma.post.findUnique to return the fully updated post
    const expectedResultWithNewTags = {
      ...mockExistingPost,
      title: "Updated Post Title",
      content: "Updated post content.",
      postTags: [
        { postId: mockPostId, tagId: 1, tag: { id: 1, name: "tag1" } },
        { postId: mockPostId, tagId: 2, tag: { id: 2, name: "tag2" } },
        { postId: mockPostId, tagId: 3, tag: { id: 3, name: "tag3" } },
        { postId: mockPostId, tagId: 4, tag: { id: 4, name: "tag4" } },
      ],
    };
    prismaMock.post.findUnique.mockResolvedValueOnce(
      expectedResultWithNewTags as any
    );

    const validatedData: ValidatedData = {
      title: "Updated Post Title",
      content: "Updated post content.",
      type: "NOTE",
      tagIds: combinedTagIds,
    };

    const result = await handlePostUpdate(validatedData, mockPostId);

    expect(prismaMock.post.update).toHaveBeenCalledWith({
      where: { id: mockPostId },
      data: {
        title: "Updated Post Title",
        content: "Updated post content.",
      },
    });

    // Assert that postTag.createMany was called with the new tags
    expect(prismaMock.postTag.createMany).toHaveBeenCalledWith({
      data: combinedTagIds.map((tagId) => ({
        postId: mockPostId,
        tagId,
      })),
    });

    expect(result).toEqual(expectedResultWithNewTags);
  });

  it("should successfully update a RESOURCE post and add new tags", async () => {
    // Mock the $transaction block
    prismaMock.$transaction.mockImplementation(
      (callback: (tx: PrismaClient) => Promise<unknown>) => callback(prismaMock)
    );

    // Mock prisma.post.update to resolve successfully
    prismaMock.post.update.mockResolvedValueOnce({
      ...mockExistingResourcePost,
      title: "Updated Resource Title",
      fileName: "updated_file.docx",
      updatedAt: new Date(),
      authorId: mockUserId,
    });

    // Mock prisma.postTag.deleteMany to resolve successfully
    prismaMock.postTag.deleteMany.mockResolvedValueOnce({
      count: mockExistingTagIds.length,
    });

    // Mock prisma.postTag.createMany to resolve successfully
    prismaMock.postTag.createMany.mockResolvedValueOnce({
      count: combinedTagIds.length,
    });

    // Mock prisma.post.findUnique to return the fully updated post
    const expectedResultWithNewTags = {
      ...mockExistingResourcePost,
      title: "Updated Resource Title",
      fileName: "updated_file.docx",
      postTags: [
        { postId: mockPostId, tagId: 1, tag: { id: 1, name: "tag1" } },
        { postId: mockPostId, tagId: 2, tag: { id: 2, name: "tag2" } },
        { postId: mockPostId, tagId: 3, tag: { id: 3, name: "tag3" } },
        { postId: mockPostId, tagId: 4, tag: { id: 4, name: "tag4" } },
      ],
    };
    prismaMock.post.findUnique.mockResolvedValueOnce(
      expectedResultWithNewTags as any
    );

    const validatedData: ValidatedData = {
      title: "Updated Resource Title",
      type: "RESOURCE",
      fileName: "updated_file.docx",
      tagIds: combinedTagIds,
    };

    const result = await handlePostUpdate(validatedData, mockPostId);

    // Assertions
    expect(prismaMock.post.update).toHaveBeenCalledWith({
      where: { id: mockPostId },
      data: {
        title: "Updated Resource Title",
        fileName: "updated_file.docx",
      },
    });
    expect(prismaMock.postTag.createMany).toHaveBeenCalledWith({
      data: combinedTagIds.map((tagId) => ({
        postId: mockPostId,
        tagId,
      })),
    });
    expect(result).toEqual(expectedResultWithNewTags);
  });

  it("should handle a case where the post to update is not found", async () => {
    // Mock the $transaction block
    prismaMock.$transaction.mockImplementation(
      (callback: (tx: PrismaClient) => Promise<unknown>) => callback(prismaMock)
    );

    // Mock prisma.post.update to throw an error for a non-existent post
    const notFoundError = new PrismaClientKnownRequestError(
      "An operation failed because it depends on one or more records that were required but not found. Record to update not found.",
      { code: "P2025", clientVersion: "2.30.2" }
    );
    prismaMock.post.update.mockRejectedValue(notFoundError);

    const validatedData: ValidatedData = {
      title: "Updated Title",
      type: "NOTE",
      content: "Updated Content",
      tagIds: [],
    };

    // Expect the function call to reject with the Prisma error
    await expect(handlePostUpdate(validatedData, mockPostId)).rejects.toThrow(
      "An operation failed because it depends on one or more records that were required but not found."
    );
  });

  it("should rollback the transaction if tag creation fails", async () => {
    // Mock the $transaction block
    prismaMock.$transaction.mockImplementation(
      (callback: (tx: PrismaClient) => Promise<unknown>) => callback(prismaMock)
    );

    // Mock prisma.post.update to resolve successfully
    prismaMock.post.update.mockResolvedValueOnce({
      ...mockExistingPost,
      title: "Updated Post Title",
      content: "Updated post content.",
      updatedAt: new Date(),
      authorId: mockUserId,
    });

    // Mock prisma.postTag.deleteMany to resolve successfully
    prismaMock.postTag.deleteMany.mockResolvedValueOnce({ count: 0 });

    // Mock prisma.postTag.createMany to throw an error
    const mockError = new Error("Tag creation failed");
    prismaMock.postTag.createMany.mockRejectedValue(mockError);

    const validatedData: ValidatedData = {
      title: "Updated Post Title",
      type: "NOTE",
      content: "Updated post content.",
      tagIds: [1, 2, 3],
    };

    // Expect the function call to reject with the error
    await expect(handlePostUpdate(validatedData, mockPostId)).rejects.toThrow(
      "Tag creation failed"
    );

    // Assert that the post update call was made, but the final fetch was not
    expect(prismaMock.post.update).toHaveBeenCalled();
    expect(prismaMock.postTag.deleteMany).toHaveBeenCalled();
    expect(prismaMock.postTag.createMany).toHaveBeenCalled();
    expect(prismaMock.post.findUnique).not.toHaveBeenCalled();
  });

  it("should not create new tags if the tagIds array is empty", async () => {
    // Mock the $transaction block
    prismaMock.$transaction.mockImplementation(
      (callback: (tx: PrismaClient) => Promise<unknown>) => callback(prismaMock)
    );

    // Mock prisma.post.update to resolve successfully
    prismaMock.post.update.mockResolvedValueOnce({
      ...mockExistingPost,
      title: "Updated Title",
      content: "Updated Content",
      updatedAt: new Date(),
      authorId: mockUserId,
    });

    // Mock prisma.postTag.deleteMany to resolve successfully
    prismaMock.postTag.deleteMany.mockResolvedValueOnce({
      count: mockExistingTagIds.length,
    });

    // Mock prisma.post.findUnique to return the post with its original tags
    // With the new logic, providing an empty tagIds array will result in an empty postTags array
    const expectedResultWithNoTags = {
      ...mockExistingPost,
      title: "Updated Title",
      content: "Updated Content",
      postTags: [],
    };
    prismaMock.post.findUnique.mockResolvedValueOnce(
      expectedResultWithNoTags as any
    );

    const validatedData: ValidatedData = {
      title: "Updated Title",
      type: "NOTE",
      content: "Updated Content",
      tagIds: [],
    };

    const result = await handlePostUpdate(validatedData, mockPostId);

    // Assertions
    expect(prismaMock.post.update).toHaveBeenCalledWith({
      where: { id: mockPostId },
      data: {
        title: "Updated Title",
        content: "Updated Content",
      },
    });
    // Ensure that deleteMany was called to remove existing tags
    expect(prismaMock.postTag.deleteMany).toHaveBeenCalledWith({
      where: { postId: mockPostId },
    });
    // Ensure that createMany was NOT called
    expect(prismaMock.postTag.createMany).not.toHaveBeenCalled();
    expect(result).toEqual(expectedResultWithNoTags);
  });

  it("should replace existing tags with new ones", async () => {
    prismaMock.$transaction.mockImplementation(
      (callback: (tx: PrismaClient) => Promise<unknown>) => callback(prismaMock)
    );

    // Mock prisma.post.update to resolve successfully
    prismaMock.post.update.mockResolvedValueOnce({
      ...mockExistingPost,
      title: "Updated Post Title",
      content: "Updated post content.",
      updatedAt: new Date(),
      authorId: mockUserId,
    });

    const newTagIds = [3, 4];

    // Mock prisma.postTag.deleteMany to resolve successfully
    prismaMock.postTag.deleteMany.mockResolvedValueOnce({
      count: mockExistingTagIds.length,
    });

    // Mock prisma.postTag.createMany to resolve successfully
    prismaMock.postTag.createMany.mockResolvedValueOnce({
      count: newTagIds.length,
    });

    // The returned object should contain ONLY the new tags
    const expectedResult = {
      ...mockExistingPost,
      title: "Updated Post Title",
      content: "Updated post content.",
      postTags: [
        { postId: mockPostId, tagId: 3, tag: { id: 3, name: "tag3" } },
        { postId: mockPostId, tagId: 4, tag: { id: 4, name: "tag4" } },
      ],
    };
    prismaMock.post.findUnique.mockResolvedValueOnce(expectedResult as any);

    const validatedData: ValidatedData = {
      title: "Updated Post Title",
      content: "Updated post content.",
      type: "NOTE",
      tagIds: newTagIds,
    };

    const result = await handlePostUpdate(validatedData, mockPostId);

    // Assertions
    expect(prismaMock.post.update).toHaveBeenCalled();
    // Ensure deleteMany was called to remove old tags
    expect(prismaMock.postTag.deleteMany).toHaveBeenCalledWith({
      where: { postId: mockPostId },
    });
    // Ensure createMany was called with the new tags
    expect(prismaMock.postTag.createMany).toHaveBeenCalledWith({
      data: newTagIds.map((tagId) => ({
        postId: mockPostId,
        tagId,
      })),
    });

    // The final result has only the new tags, confirming the replacement logic works
    expect(result).toEqual(expectedResult);
  });
});
