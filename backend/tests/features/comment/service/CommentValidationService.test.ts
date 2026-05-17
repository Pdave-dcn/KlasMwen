import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  CommentNotFoundError,
  CommentPostMismatchError,
} from "../../../../src/core/error/custom/comment.error.js";
import { CommentValidationService } from "../../../../src/features/comment/service/core/CommentValidationService.js";

const mockFindById = vi.fn();

const mockRepo = {
  findById: mockFindById,
};

describe("CommentValidationService", () => {
  let service: CommentValidationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CommentValidationService(mockRepo as any);
  });

  describe("commentExists", () => {
    it("should return the comment when found", async () => {
      const comment = { id: 1, parentId: null, authorId: "user1", postId: "post1" };
      mockFindById.mockResolvedValue(comment);

      const result = await service.commentExists(1);

      expect(mockFindById).toHaveBeenCalledWith(1);
      expect(result).toEqual(comment);
    });

    it("should throw CommentNotFoundError when comment does not exist", async () => {
      mockFindById.mockResolvedValue(null);

      await expect(service.commentExists(999)).rejects.toThrow(CommentNotFoundError);
      expect(mockFindById).toHaveBeenCalledWith(999);
    });
  });

  describe("validateParentComment", () => {
    it("should return parent comment when valid", async () => {
      const parentComment = { id: 1, parentId: null, authorId: "user1", postId: "post1" };
      mockFindById.mockResolvedValue(parentComment);

      const result = await service.validateParentComment(1, "post1");

      expect(mockFindById).toHaveBeenCalledWith(1);
      expect(result).toEqual(parentComment);
    });

    it("should throw CommentNotFoundError when parent does not exist", async () => {
      mockFindById.mockResolvedValue(null);

      await expect(
        service.validateParentComment(999, "post1"),
      ).rejects.toThrow(CommentNotFoundError);
    });

    it("should throw CommentPostMismatchError when parent belongs to different post", async () => {
      const parentComment = { id: 1, parentId: null, authorId: "user1", postId: "post-other" };
      mockFindById.mockResolvedValue(parentComment);

      await expect(
        service.validateParentComment(1, "post1"),
      ).rejects.toThrow(CommentPostMismatchError);
    });
  });
});
