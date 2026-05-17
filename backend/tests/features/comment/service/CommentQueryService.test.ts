import { describe, it, expect, vi, beforeEach } from "vitest";

import { PostNotFoundError } from "../../../../src/core/error/custom/post.error.js";
import { CommentQueryService } from "../../../../src/features/comment/service/core/CommentQueryService.js";
import {
  buildPaginatedQuery,
  processPaginatedResults,
} from "../../../../src/utils/pagination.util.js";

const mockFindByUserWithRelations = vi.fn();
const mockFindParentCommentsByPost = vi.fn();
const mockCountByPost = vi.fn();
const mockFindRepliesByParent = vi.fn();
const mockVerifyPostExists = vi.fn();
const mockTransformCommentsForResponse = vi.fn();

const mockRepo = {
  findByUserWithRelations: mockFindByUserWithRelations,
  findParentCommentsByPost: mockFindParentCommentsByPost,
  countByPost: mockCountByPost,
  findRepliesByParent: mockFindRepliesByParent,
};

const mockTransformer = {
  transformCommentsForResponse: mockTransformCommentsForResponse,
};

vi.mock("../../../../src/features/posts/service/PostService.js", () => ({
  postService: {
    validate: {
      verifyPostExists: (...args: unknown[]) => mockVerifyPostExists(...args),
    },
  },
}));

const mockUserId = "user-1";
const mockPostId = "post-1";

describe("CommentQueryService", () => {
  let service: CommentQueryService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CommentQueryService(mockRepo as any, mockTransformer as any);
  });

  describe("getUserCommentsWithRelations", () => {
    it("should return transformed comments with pagination", async () => {
      const rawComments = [{ id: 1, content: "Test" }];
      const transformed = [{ id: 1, content: "Test", isReply: false }];
      mockFindByUserWithRelations.mockResolvedValue(rawComments);
      mockTransformCommentsForResponse.mockReturnValue(transformed);

      const result = await service.getUserCommentsWithRelations(mockUserId, 10);

      expect(mockFindByUserWithRelations).toHaveBeenCalled();
      expect(result).toEqual({
        data: transformed,
        pagination: { hasMore: false, nextCursor: null },
      });
    });

    it("should return empty data when user has no comments", async () => {
      mockFindByUserWithRelations.mockResolvedValue([]);
      mockTransformCommentsForResponse.mockReturnValue([]);

      const result = await service.getUserCommentsWithRelations(mockUserId, 10);

      expect(result.data).toEqual([]);
      expect(result.pagination.hasMore).toBe(false);
    });
  });

  describe("getParentComments", () => {
    it("should return paginated parent comments with total count", async () => {
      const comments = [{ id: 1, content: "Parent comment" }];
      mockVerifyPostExists.mockResolvedValue({ id: mockPostId, authorId: "author-1" });
      mockFindParentCommentsByPost.mockResolvedValue(comments);
      mockCountByPost.mockResolvedValue(5);

      const result = await service.getParentComments(mockPostId, 10);

      expect(mockVerifyPostExists).toHaveBeenCalledWith(mockPostId);
      expect(mockFindParentCommentsByPost).toHaveBeenCalled();
      expect(mockCountByPost).toHaveBeenCalledWith(mockPostId);
      expect(result.data).toEqual(comments);
      expect(result.pagination.totalComments).toBe(5);
    });

    it("should throw PostNotFoundError when post does not exist", async () => {
      mockVerifyPostExists.mockRejectedValue(new PostNotFoundError(mockPostId));

      await expect(
        service.getParentComments(mockPostId, 10),
      ).rejects.toThrow(PostNotFoundError);

      expect(mockFindParentCommentsByPost).not.toHaveBeenCalled();
    });
  });

  describe("getReplies", () => {
    it("should return paginated replies", async () => {
      const replies = [{ id: 2, content: "A reply" }];
      mockFindRepliesByParent.mockResolvedValue(replies);

      const result = await service.getReplies(1, 10);

      expect(mockFindRepliesByParent).toHaveBeenCalled();
      expect(result.data).toEqual(replies);
    });

    it("should return empty data when no replies", async () => {
      mockFindRepliesByParent.mockResolvedValue([]);

      const result = await service.getReplies(1, 10);

      expect(result.data).toEqual([]);
      expect(result.pagination.hasMore).toBe(false);
    });
  });
});
