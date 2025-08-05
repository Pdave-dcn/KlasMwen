import { PostType } from "@prisma/client";
import { describe, it, expect, vi } from "vitest";

import {
  handleCommentPagination,
  handlePostWithCommentPagination,
} from "../lib/commentPaginationHandler";

import type {
  Comment,
  RawPostWithComments,
  TransformedPostWithPagination,
} from "../types/postTypes";

vi.mock("./postTagFlattener", () => ({
  default: vi.fn((post) => {
    const { postTags, ...restOfPost } = post;
    return {
      ...restOfPost,
      tags: postTags.map((pt: any) => pt.tag),
    };
  }),
}));

describe("handleCommentPagination", () => {
  const createMockComment = (id: number): Comment => ({
    id,
    content: `Comment ${id}`,
    createdAt: new Date(`2024-01-${id.toString().padStart(2, "0")}T00:00:00Z`),
    author: {
      id: `user-${id}`,
      username: `user${id}`,
      avatarUrl: `https://example.com/avatar${id}.jpg`,
    },
  });

  describe("when comments length equals limit", () => {
    it("should return all comments with no next page", () => {
      const comments = [createMockComment(1), createMockComment(2)];
      const limit = 2;
      const totalComments = 10;

      const result = handleCommentPagination(comments, limit, totalComments);

      expect(result.paginatedComments).toHaveLength(2);
      expect(result.paginatedComments).toEqual(comments);
      expect(result.paginationMeta.hasNextPage).toBe(false);
      expect(result.paginationMeta.nextCursor).toBe(null);
      expect(result.paginationMeta.totalComments).toBe(10);
    });
  });

  describe("when comments length is greater than limit", () => {
    it("should remove extra comment and set hasNextPage to true", () => {
      const comments = [
        createMockComment(1),
        createMockComment(2),
        createMockComment(3),
      ];
      const limit = 2;
      const totalComments = 15;

      const result = handleCommentPagination(comments, limit, totalComments);

      expect(result.paginatedComments).toHaveLength(2);
      expect(result.paginatedComments[0].id).toBe(1);
      expect(result.paginatedComments[1].id).toBe(2);
      expect(result.paginationMeta.hasNextPage).toBe(true);
      expect(result.paginationMeta.nextCursor).toBe("2");
      expect(result.paginationMeta.totalComments).toBe(15);
    });

    it("should handle multiple extra comments correctly", () => {
      const comments = [
        createMockComment(1),
        createMockComment(2),
        createMockComment(3),
        createMockComment(4),
        createMockComment(5),
      ];
      const limit = 3;
      const totalComments = 20;

      const result = handleCommentPagination(comments, limit, totalComments);

      expect(result.paginatedComments).toHaveLength(3);
      expect(result.paginatedComments.map((c) => c.id)).toEqual([1, 2, 3]);
      expect(result.paginationMeta.hasNextPage).toBe(true);
      expect(result.paginationMeta.nextCursor).toBe("3");
    });
  });

  describe("when comments array is empty", () => {
    it("should return empty array with no next page", () => {
      const comments: Comment[] = [];
      const limit = 5;
      const totalComments = 0;

      const result = handleCommentPagination(comments, limit, totalComments);

      expect(result.paginatedComments).toHaveLength(0);
      expect(result.paginationMeta.hasNextPage).toBe(false);
      expect(result.paginationMeta.nextCursor).toBe(null);
      expect(result.paginationMeta.totalComments).toBe(0);
    });
  });

  describe("when comments length is less than limit", () => {
    it("should return all comments with no next page", () => {
      const comments = [createMockComment(1)];
      const limit = 3;
      const totalComments = 1;

      const result = handleCommentPagination(comments, limit, totalComments);

      expect(result.paginatedComments).toHaveLength(1);
      expect(result.paginatedComments).toEqual(comments);
      expect(result.paginationMeta.hasNextPage).toBe(false);
      expect(result.paginationMeta.nextCursor).toBe(null);
      expect(result.paginationMeta.totalComments).toBe(1);
    });

    it("should handle case with multiple comments under limit", () => {
      const comments = [createMockComment(1), createMockComment(2)];
      const limit = 5;
      const totalComments = 2;

      const result = handleCommentPagination(comments, limit, totalComments);

      expect(result.paginatedComments).toHaveLength(2);
      expect(result.paginationMeta.hasNextPage).toBe(false);
      expect(result.paginationMeta.nextCursor).toBe(null);
    });
  });

  describe("cursor generation", () => {
    it("should convert comment ID to string for cursor", () => {
      const comments = [
        createMockComment(42),
        createMockComment(999),
        createMockComment(1001),
      ];
      const limit = 2;
      const totalComments = 10;

      const result = handleCommentPagination(comments, limit, totalComments);

      expect(result.paginationMeta.nextCursor).toBe("999");
    });

    it("should handle single digit IDs correctly", () => {
      const comments = [createMockComment(1), createMockComment(2)];
      const limit = 1;
      const totalComments = 5;

      const result = handleCommentPagination(comments, limit, totalComments);

      expect(result.paginationMeta.nextCursor).toBe("1");
    });
  });

  describe("immutability", () => {
    it("should not mutate the original comments array", () => {
      const originalComments = [
        createMockComment(1),
        createMockComment(2),
        createMockComment(3),
      ];
      const commentsCopy = [...originalComments];
      const limit = 2;
      const totalComments = 10;

      handleCommentPagination(originalComments, limit, totalComments);

      expect(originalComments).toEqual(commentsCopy);
      expect(originalComments).toHaveLength(3);
    });

    it("should create new array for paginatedComments", () => {
      const comments = [createMockComment(1), createMockComment(2)];
      const result = handleCommentPagination(comments, 2, 5);

      expect(result.paginatedComments).not.toBe(comments);
      expect(result.paginatedComments).toEqual(comments);
    });
  });

  describe("edge cases", () => {
    it("should handle limit of 0", () => {
      const comments = [createMockComment(1)];
      const limit = 0;
      const totalComments = 1;

      const result = handleCommentPagination(comments, limit, totalComments);

      expect(result.paginatedComments).toHaveLength(0);
      expect(result.paginationMeta.hasNextPage).toBe(true);
      expect(result.paginationMeta.nextCursor).toBe(null);
    });

    it("should handle large comment IDs", () => {
      const comments = [createMockComment(999999), createMockComment(1000000)];
      const limit = 1;
      const totalComments = 2;

      const result = handleCommentPagination(comments, limit, totalComments);

      expect(result.paginationMeta.nextCursor).toBe("999999");
    });
  });
});

describe("handlePostWithCommentPagination", () => {
  const mockAuthor = {
    id: "user-123",
    username: "testuser",
    avatarUrl: "https://example.com/avatar.jpg",
  };

  const createMockPost = (
    commentCount: number,
    totalComments: number
  ): RawPostWithComments => ({
    id: "post-123",
    title: "Test Post",
    content: "This is a test post",
    type: PostType.QUESTION,
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-02T00:00:00Z"),
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
    comments: Array.from({ length: commentCount }, (_, i) => ({
      id: i + 1,
      content: `Comment ${i + 1}`,
      createdAt: new Date(
        `2024-01-${(i + 1).toString().padStart(2, "0")}T00:00:00Z`
      ),
      author: {
        id: `user-${i + 1}`,
        username: `user${i + 1}`,
        avatarUrl: null,
      },
    })),
    _count: {
      comments: totalComments,
      likes: 5,
    },
  });

  describe("integration with handleCommentPagination", () => {
    it("should transform post and handle pagination when comments exceed limit", () => {
      const post = createMockPost(3, 10); // 3 comments fetched, 10 total
      const commentLimit = 2;

      const result = handlePostWithCommentPagination(post, commentLimit);

      // Check post transformation
      expect(result.id).toBe("post-123");
      expect(result.title).toBe("Test Post");
      expect(result.tags).toEqual([
        { id: 1, name: "Tech" },
        { id: 2, name: "JavaScript" },
      ]);
      expect(result).not.toHaveProperty("postTags");

      // Check comment pagination
      expect(result.comments).toHaveLength(2);
      expect(result.comments?.[0].id).toBe(1);
      expect(result.comments?.[1].id).toBe(2);

      // Check pagination metadata
      expect(result.commentsPagination.hasNextPage).toBe(true);
      expect(result.commentsPagination.nextCursor).toBe("2");
      expect(result.commentsPagination.totalComments).toBe(10);
    });

    it("should use totalComments from _count for pagination metadata", () => {
      const post = createMockPost(2, 25); // 2 comments fetched, 25 total
      const commentLimit = 2;

      const result = handlePostWithCommentPagination(post, commentLimit);

      expect(result.commentsPagination.totalComments).toBe(25);
      expect(result._count.comments).toBe(25);
    });
  });

  describe("various comment scenarios", () => {
    it("should handle case when comments equal limit", () => {
      const post = createMockPost(2, 5); // 2 comments fetched, 5 total
      const commentLimit = 2;

      const result = handlePostWithCommentPagination(post, commentLimit);

      expect(result.comments).toHaveLength(2);
      expect(result.commentsPagination.hasNextPage).toBe(false);
      expect(result.commentsPagination.nextCursor).toBe(null);
      expect(result.commentsPagination.totalComments).toBe(5);
    });

    it("should handle post with no comments", () => {
      const post = createMockPost(0, 0); // 0 comments fetched, 0 total
      const commentLimit = 5;

      const result = handlePostWithCommentPagination(post, commentLimit);

      expect(result.comments).toHaveLength(0);
      expect(result.commentsPagination.hasNextPage).toBe(false);
      expect(result.commentsPagination.nextCursor).toBe(null);
      expect(result.commentsPagination.totalComments).toBe(0);
    });

    it("should handle case when comments are less than limit", () => {
      const post = createMockPost(1, 1); // 1 comment fetched, 1 total
      const commentLimit = 5;

      const result = handlePostWithCommentPagination(post, commentLimit);

      expect(result.comments).toHaveLength(1);
      expect(result.commentsPagination.hasNextPage).toBe(false);
      expect(result.commentsPagination.nextCursor).toBe(null);
      expect(result.commentsPagination.totalComments).toBe(1);
    });

    it("should handle large number of comments", () => {
      const post = createMockPost(11, 100); // 11 comments fetched (limit + 1), 100 total
      const commentLimit = 10;

      const result = handlePostWithCommentPagination(post, commentLimit);

      expect(result.comments).toHaveLength(10);
      expect(result.commentsPagination.hasNextPage).toBe(true);
      expect(result.commentsPagination.nextCursor).toBe("10");
      expect(result.commentsPagination.totalComments).toBe(100);
    });
  });

  describe("post property preservation", () => {
    it("should preserve all post properties while adding pagination", () => {
      const post = createMockPost(3, 15);
      const commentLimit = 2;

      const result = handlePostWithCommentPagination(post, commentLimit);

      // Check all original properties are preserved
      expect(result.id).toBe(post.id);
      expect(result.title).toBe(post.title);
      expect(result.content).toBe(post.content);
      expect(result.type).toBe(post.type);
      expect(result.createdAt).toBe(post.createdAt);
      expect(result.updatedAt).toBe(post.updatedAt);
      expect(result.author).toBe(post.author);
      expect(result._count).toBe(post._count);

      // Check pagination metadata is added
      expect(result.commentsPagination).toBeDefined();
      expect(typeof result.commentsPagination.hasNextPage).toBe("boolean");
      expect(typeof result.commentsPagination.totalComments).toBe("number");
    });

    it("should handle post without updatedAt", () => {
      const post = createMockPost(2, 5);
      delete post.updatedAt;

      const result = handlePostWithCommentPagination(post, 2);

      expect(result.updatedAt).toBeUndefined();
      expect(result.commentsPagination).toBeDefined();
    });
  });

  describe("PostType variations", () => {
    it("should handle different PostType values", () => {
      const notePost = {
        ...createMockPost(2, 5),
        type: PostType.NOTE,
      };

      const resourcePost = {
        ...createMockPost(2, 5),
        type: PostType.RESOURCE,
      };

      const noteResult = handlePostWithCommentPagination(notePost, 2);
      const resourceResult = handlePostWithCommentPagination(resourcePost, 2);

      expect(noteResult.type).toBe(PostType.NOTE);
      expect(resourceResult.type).toBe(PostType.RESOURCE);
    });
  });

  describe("TypeScript type safety", () => {
    it("should return correct TypeScript types", () => {
      const post = createMockPost(2, 5);
      const result: TransformedPostWithPagination =
        handlePostWithCommentPagination(post, 2);

      // Type assertions to ensure TypeScript compilation
      expect(typeof result.id).toBe("string");
      expect(Array.isArray(result.tags)).toBe(true);
      expect(Array.isArray(result.comments)).toBe(true);
      expect(typeof result.commentsPagination.hasNextPage).toBe("boolean");
      expect(typeof result.commentsPagination.totalComments).toBe("number");
      expect(result).not.toHaveProperty("postTags");
    });

    it("should ensure comments are properly typed", () => {
      const post = createMockPost(3, 10);
      const result = handlePostWithCommentPagination(post, 2);

      if (result.comments && result.comments.length > 0) {
        const firstComment = result.comments[0];
        expect(typeof firstComment.id).toBe("number");
        expect(typeof firstComment.content).toBe("string");
        expect(firstComment.createdAt).toBeInstanceOf(Date);
        expect(typeof firstComment.author.id).toBe("string");
        expect(typeof firstComment.author.username).toBe("string");
      }
    });
  });

  describe("edge cases and error conditions", () => {
    it("should handle edge case with single comment and limit of 1", () => {
      const post = createMockPost(2, 10); // 2 comments fetched (limit + 1), 10 total
      const commentLimit = 1;

      const result = handlePostWithCommentPagination(post, commentLimit);

      expect(result.comments).toHaveLength(1);
      expect(result.comments?.[0].id).toBe(1);
      expect(result.commentsPagination.hasNextPage).toBe(true);
      expect(result.commentsPagination.nextCursor).toBe("1");
      expect(result.commentsPagination.totalComments).toBe(10);
    });

    it("should handle zero comment limit", () => {
      const post = createMockPost(1, 5);
      const result = handlePostWithCommentPagination(post, 0);

      expect(result.comments).toHaveLength(0);
      expect(result.commentsPagination.hasNextPage).toBe(true);
      expect(result.commentsPagination.nextCursor).toBe(null);
    });

    it("should handle posts with complex tag structures", () => {
      const post = createMockPost(2, 5);
      post.postTags = [
        {
          postId: "post-123",
          tagId: 999,
          tag: { id: 999, name: "Complex Tag Name With Spaces" },
        },
      ];

      const result = handlePostWithCommentPagination(post, 2);

      expect(result.tags).toEqual([
        { id: 999, name: "Complex Tag Name With Spaces" },
      ]);
    });
  });
});
