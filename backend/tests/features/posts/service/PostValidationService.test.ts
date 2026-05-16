import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { postValidationService } from "../../../../src/features/posts/service/core/PostValidationService.js";
import { PostNotFoundError } from "../../../../src/core/error/custom/post.error.js";
import { PostUpdateFailedError } from "../../../../src/core/error/custom/post.error.js";

const mockExists = vi.fn();

vi.mock(
  "../../../../src/features/posts/service/repositories/postRepository.js",
  () => ({
    postRepository: {
      validate: {
        exists: (...args: unknown[]) => mockExists(...args),
      },
    },
  }),
);

describe("PostValidationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("verifyPostExists", () => {
    const mockPost = {
      id: "post-1",
      authorId: "u1",
      type: "NOTE" as const,
      fileUrl: null,
      createdAt: new Date("2024-01-01"),
    };

    it("should return post when it exists", async () => {
      mockExists.mockResolvedValue(mockPost);

      const result = await postValidationService.verifyPostExists("post-1");

      expect(mockExists).toHaveBeenCalledWith("post-1");
      expect(result).toEqual(mockPost);
    });

    it("should throw PostNotFoundError when post does not exist", async () => {
      mockExists.mockResolvedValue(null);

      await expect(
        postValidationService.verifyPostExists("nonexistent"),
      ).rejects.toThrow(PostNotFoundError);

      expect(mockExists).toHaveBeenCalledWith("nonexistent");
    });
  });

  describe("validateEditTimeWindow", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should not throw if within edit window", () => {
      const recentDate = new Date(Date.now() - 60 * 1000); // 1 minute ago

      expect(() =>
        postValidationService.validateEditTimeWindow(recentDate, "post-1"),
      ).not.toThrow();
    });

    it("should throw PostUpdateFailedError if edit window expired", () => {
      const oldDate = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago

      expect(() =>
        postValidationService.validateEditTimeWindow(oldDate, "post-1"),
      ).toThrow(PostUpdateFailedError);
    });
  });
});
