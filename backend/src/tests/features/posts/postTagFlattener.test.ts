import { PostType } from "@prisma/client";
import { describe, it, expect } from "vitest";

import transformPostTagsToFlat from "../../../features/posts/postTagFlattener";

import type { RawPost, TransformedPost } from "../../../types/postTypes";

describe("transformPostTagsToFlat", () => {
  const mockAuthor = {
    id: "user-123",
    username: "testuser",
    avatarUrl: "https://example.com/avatar.jpg",
  };

  const mockComment = {
    id: 1,
    content: "Test comment",
    createdAt: new Date("2024-01-01T00:00:00Z"),
    author: mockAuthor,
  };

  const mockCount = {
    comments: 5,
    likes: 10,
  };

  it("should transform postTags to flat tags array", () => {
    const rawPost: RawPost = {
      id: "post-123",
      title: "Test Post",
      content: "This is a test post",
      type: PostType.NOTE,
      createdAt: new Date("2024-01-01T00:00:00Z"),
      author: mockAuthor,
      postTags: [
        {
          postId: "post-123",
          tagId: 1,
          tag: { id: 1, name: "Tech" },
        },
        {
          postId: "post-123",
          tagId: 2,
          tag: { id: 2, name: "JavaScript" },
        },
      ],
      _count: mockCount,
      fileUrl: null,
      fileName: null,
      fileSize: null,
      mimeType: null,
    };

    const result = transformPostTagsToFlat(rawPost);

    expect(result).toEqual({
      id: "post-123",
      title: "Test Post",
      content: "This is a test post",
      type: PostType.NOTE,
      createdAt: new Date("2024-01-01T00:00:00Z"),
      author: mockAuthor,
      tags: [
        { id: 1, name: "Tech" },
        { id: 2, name: "JavaScript" },
      ],
      _count: mockCount,
      fileUrl: null,
      fileName: null,
      fileSize: null,
      mimeType: null,
    });
  });

  it("should handle empty postTags array", () => {
    const rawPost: RawPost = {
      id: "post-456",
      title: "Post without tags",
      content: "This post has no tags",
      type: PostType.QUESTION,
      createdAt: new Date("2024-01-02T00:00:00Z"),
      author: mockAuthor,
      postTags: [],
      _count: mockCount,
      fileUrl: null,
      fileName: null,
      fileSize: null,
      mimeType: null,
    };

    const result = transformPostTagsToFlat(rawPost);

    expect(result.tags).toEqual([]);
    expect(result).not.toHaveProperty("postTags");
    expect(result.id).toBe("post-456");
    expect(result.title).toBe("Post without tags");
  });

  it("should preserve all other properties except postTags", () => {
    const rawPost: RawPost = {
      id: "post-789",
      title: "Full Post",
      content: "Post with all properties",
      type: PostType.NOTE,
      createdAt: new Date("2024-01-03T00:00:00Z"),
      updatedAt: new Date("2024-01-04T00:00:00Z"),
      author: {
        id: "user-456",
        username: "anotheruser",
        avatarUrl: null,
      },
      postTags: [
        {
          postId: "post-789",
          tagId: 3,
          tag: { id: 3, name: "React" },
        },
      ],
      comments: [mockComment],
      _count: {
        comments: 1,
        likes: 3,
      },
      fileUrl: null,
      fileName: null,
      fileSize: null,
      mimeType: null,
    };

    const result = transformPostTagsToFlat(rawPost);

    expect(result).toEqual({
      id: "post-789",
      title: "Full Post",
      content: "Post with all properties",
      type: PostType.NOTE,
      createdAt: new Date("2024-01-03T00:00:00Z"),
      updatedAt: new Date("2024-01-04T00:00:00Z"),
      author: {
        id: "user-456",
        username: "anotheruser",
        avatarUrl: null,
      },
      tags: [{ id: 3, name: "React" }],
      comments: [mockComment],
      _count: {
        comments: 1,
        likes: 3,
      },
      fileUrl: null,
      fileName: null,
      fileSize: null,
      mimeType: null,
    });
  });

  it("should not modify the original post object", () => {
    const originalPostTags = [
      {
        postId: "post-999",
        tagId: 1,
        tag: { id: 1, name: "Original" },
      },
    ];

    const rawPost: RawPost = {
      id: "post-999",
      title: "Immutability Test",
      content: "Testing immutability",
      type: PostType.NOTE,
      createdAt: new Date("2024-01-05T00:00:00Z"),
      author: mockAuthor,
      postTags: originalPostTags,
      _count: mockCount,
      fileUrl: null,
      fileName: null,
      fileSize: null,
      mimeType: null,
    };

    const result = transformPostTagsToFlat(rawPost);

    // Original object should remain unchanged
    expect(rawPost.postTags).toBe(originalPostTags);
    expect(rawPost.postTags).toHaveLength(1);
    expect(rawPost).toHaveProperty("postTags");

    // Result should have transformed data
    expect(result).not.toHaveProperty("postTags");
    expect(result.tags).toEqual([{ id: 1, name: "Original" }]);
  });

  it("should handle single tag correctly", () => {
    const rawPost: RawPost = {
      id: "post-single",
      title: "Single Tag Post",
      content: "Post with one tag",
      type: PostType.QUESTION,
      createdAt: new Date("2024-01-06T00:00:00Z"),
      author: mockAuthor,
      postTags: [
        {
          postId: "post-single",
          tagId: 42,
          tag: { id: 42, name: "Unique" },
        },
      ],
      _count: mockCount,
      fileUrl: null,
      fileName: null,
      fileSize: null,
      mimeType: null,
    };

    const result = transformPostTagsToFlat(rawPost);

    expect(result.tags).toHaveLength(1);
    expect(result.tags[0]).toEqual({ id: 42, name: "Unique" });
  });

  it("should handle multiple tags with different ids and names", () => {
    const rawPost: RawPost = {
      id: "post-multi",
      title: "Multi Tag Post",
      content: "Post with multiple tags",
      type: PostType.NOTE,
      createdAt: new Date("2024-01-07T00:00:00Z"),
      author: mockAuthor,
      postTags: [
        {
          postId: "post-multi",
          tagId: 1,
          tag: { id: 1, name: "Web Development" },
        },
        {
          postId: "post-multi",
          tagId: 5,
          tag: { id: 5, name: "TypeScript" },
        },
        {
          postId: "post-multi",
          tagId: 10,
          tag: { id: 10, name: "Testing" },
        },
      ],
      _count: mockCount,
      fileUrl: null,
      fileName: null,
      fileSize: null,
      mimeType: null,
    };

    const result = transformPostTagsToFlat(rawPost);

    expect(result.tags).toHaveLength(3);
    expect(result.tags).toEqual([
      { id: 1, name: "Web Development" },
      { id: 5, name: "TypeScript" },
      { id: 10, name: "Testing" },
    ]);
  });

  it("should return correct TypeScript types", () => {
    const rawPost: RawPost = {
      id: "post-types",
      title: "Type Test",
      content: "Testing types",
      type: PostType.NOTE,
      createdAt: new Date(),
      author: mockAuthor,
      postTags: [],
      _count: mockCount,
      fileUrl: null,
      fileName: null,
      fileSize: null,
      mimeType: null,
    };

    const result: TransformedPost = transformPostTagsToFlat(rawPost);

    // These type assertions ensure TypeScript compilation passes
    expect(typeof result.id).toBe("string");
    expect(typeof result.title).toBe("string");
    expect(typeof result.content).toBe("string");
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(Array.isArray(result.tags)).toBe(true);
    expect(result).not.toHaveProperty("postTags");
  });
});
