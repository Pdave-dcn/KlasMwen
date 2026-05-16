import { describe, it, expect } from "vitest";

import { postTransformer } from "../../../../src/features/posts/service/transformers/postTransformers.js";

const makePost = (overrides: Record<string, unknown> = {}) => ({
  id: "post-1",
  title: "Test Post",
  content: "Some content",
  type: "NOTE" as const,
  fileUrl: null,
  fileName: null,
  createdAt: new Date("2024-01-01"),
  author: { id: "u1", username: "user", Avatar: null },
  postTags: [],
  _count: { comments: 0, likes: 0 },
  ...overrides,
});

describe("PostTransformer", () => {
  describe("transformPost", () => {
    it("should flatten postTags to tags array", () => {
      const post = makePost({
        postTags: [
          { postId: "p1", tagId: 1, tag: { id: 1, name: "Tech" } },
        ],
      });
      const result = postTransformer.transformPost(post);

      expect(result.tags).toEqual([{ id: 1, name: "Tech" }]);
      expect(result).not.toHaveProperty("postTags");
    });

    it("should handle empty postTags", () => {
      const post = makePost({ postTags: [] });
      const result = postTransformer.transformPost(post);

      expect(result.tags).toEqual([]);
      expect(result).not.toHaveProperty("postTags");
    });
  });

  describe("transformPosts", () => {
    it("should transform each post", () => {
      const posts = [makePost({ id: "p1" }), makePost({ id: "p2" })];
      const result = postTransformer.transformPosts(posts);

      expect(result).toHaveLength(2);
      expect(result[0]).not.toHaveProperty("postTags");
      expect(result[1]).not.toHaveProperty("postTags");
    });

    it("should return empty array for empty input", () => {
      const result = postTransformer.transformPosts([]);

      expect(result).toEqual([]);
    });
  });

  describe("transformPostsWithTruncation", () => {
    it("should truncate content for posts with text", () => {
      const posts = [makePost({ content: "Hello world this is a test post" })];
      const result = postTransformer.transformPostsWithTruncation(posts);

      expect(result).toHaveLength(1);
      expect(result[0].content).toBeTruthy();
    });

    it("should return null content for posts without content", () => {
      const posts = [makePost({ content: "" })];
      const result = postTransformer.transformPostsWithTruncation(posts);

      expect(result[0].content).toBeNull();
    });
  });

  describe("toEditResponse", () => {
    it("should return file info for resource posts", () => {
      const post = makePost({
        type: "RESOURCE",
        fileUrl: "http://example.com/file.pdf",
        fileName: "file.pdf",
        fileSize: 1024,
        tags: [],
      });
      const result = postTransformer.toEditResponse(post);

      expect(result.hasFile).toBe(true);
      expect(result.fileName).toBe("file.pdf");
      expect(result.fileSize).toBe(1024);
    });

    it("should return content for text posts", () => {
      const post = makePost({
        type: "NOTE",
        content: "Some post content",
        tags: [],
      });
      const result = postTransformer.toEditResponse(post);

      expect(result.hasFile).toBe(false);
      expect(result.content).toBe("Some post content");
    });
  });
});
