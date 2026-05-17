import { describe, it, expect, vi, beforeEach } from "vitest";

import { PostNotFoundError } from "../../../../src/core/error/custom/post.error.js";
import { CommentNotFoundError } from "../../../../src/core/error/custom/comment.error.js";
import { CommentCommandService } from "../../../../src/features/comment/service/core/CommentCommandService.js";
import { CommentValidationService } from "../../../../src/features/comment/service/core/CommentValidationService.js";

const mockVerifyPostExists = vi.fn();
const mockFindById = vi.fn();
const mockCreate = vi.fn();
const mockDelete = vi.fn();
const mockAssertPermission = vi.fn();
const mockCreateNotification = vi.fn();

vi.mock("../../../../src/features/posts/service/PostService.js", () => ({
  postService: {
    validate: {
      verifyPostExists: (...args: unknown[]) => mockVerifyPostExists(...args),
    },
  },
}));

vi.mock("../../../../src/core/security/rbac.js", () => ({
  assertPermission: (...args: unknown[]) => mockAssertPermission(...args),
}));

vi.mock("../../../../src/features/notification/service/NotificationService.js", () => ({
  default: {
    createNotification: (...args: unknown[]) => mockCreateNotification(...args),
  },
}));

const mockUserId = "user-1";
const mockAuthorId = "author-1";
const mockPostId = "post-1";

describe("CommentCommandService", () => {
  let service: CommentCommandService;
  let validationService: CommentValidationService;

  beforeEach(() => {
    vi.clearAllMocks();
    const mockRepo = {
      findById: mockFindById,
      create: mockCreate,
      delete: mockDelete,
    };
    validationService = new CommentValidationService(mockRepo as any);
    service = new CommentCommandService(validationService, mockRepo as any);
  });

  describe("createComment", () => {
    it("should create a root comment and notify post author", async () => {
      const post = { id: mockPostId, authorId: mockAuthorId };
      const newComment = { id: 1, content: "Great post!", postId: mockPostId, authorId: mockUserId, parentId: null };
      mockVerifyPostExists.mockResolvedValue(post);
      mockCreate.mockResolvedValue(newComment);

      const result = await service.createComment({
        content: "Great post!",
        authorId: mockUserId,
        postId: mockPostId,
      });

      expect(mockVerifyPostExists).toHaveBeenCalledWith(mockPostId);
      expect(mockCreate).toHaveBeenCalledWith({
        content: "Great post!",
        author: { connect: { id: mockUserId } },
        post: { connect: { id: mockPostId } },
      });
      expect(mockCreateNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: "COMMENT_ON_POST", userId: mockAuthorId }),
        undefined,
      );
      expect(result).toEqual(newComment);
    });

    it("should create a reply to a root comment", async () => {
      const post = { id: mockPostId, authorId: mockAuthorId };
      const parentComment = { id: 5, parentId: null, authorId: "parent-author", postId: mockPostId };
      const newComment = { id: 6, content: "Nice reply!", postId: mockPostId, authorId: mockUserId, parentId: 5 };
      mockVerifyPostExists.mockResolvedValue(post);
      mockFindById.mockResolvedValue(parentComment);
      mockCreate.mockResolvedValue(newComment);

      const result = await service.createComment({
        content: "Nice reply!",
        authorId: mockUserId,
        postId: mockPostId,
        parentId: 5,
      });

      expect(mockCreate).toHaveBeenCalledWith({
        content: "Nice reply!",
        author: { connect: { id: mockUserId } },
        post: { connect: { id: mockPostId } },
        parent: { connect: { id: 5 } },
      });
      expect(mockCreateNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: "REPLY_TO_COMMENT", userId: "parent-author" }),
        undefined,
      );
      expect(result).toEqual(newComment);
    });

    it("should flatten reply-to-reply to 2 levels", async () => {
      const post = { id: mockPostId, authorId: mockAuthorId };
      const replyComment = { id: 10, parentId: 5, authorId: "intermediate-user", postId: mockPostId };
      const newComment = { id: 11, content: "Deep reply", postId: mockPostId, authorId: mockUserId, parentId: 5 };
      mockVerifyPostExists.mockResolvedValue(post);
      mockFindById.mockResolvedValue(replyComment);
      mockCreate.mockResolvedValue(newComment);

      const result = await service.createComment({
        content: "Deep reply",
        authorId: mockUserId,
        postId: mockPostId,
        parentId: 10,
      });

      expect(mockCreate).toHaveBeenCalledWith({
        content: "Deep reply",
        author: { connect: { id: mockUserId } },
        post: { connect: { id: mockPostId } },
        parent: { connect: { id: 5 } },
        mentionedUser: { connect: { id: "intermediate-user" } },
      });
      expect(result).toEqual(newComment);
    });

    it("should throw PostNotFoundError when post does not exist", async () => {
      mockVerifyPostExists.mockRejectedValue(new PostNotFoundError(mockPostId));

      await expect(
        service.createComment({ content: "test", authorId: mockUserId, postId: mockPostId }),
      ).rejects.toThrow(PostNotFoundError);

      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  describe("deleteComment", () => {
    it("should delete a comment when user has permission", async () => {
      const comment = { id: 1, parentId: null, authorId: mockUserId, postId: mockPostId };
      mockFindById.mockResolvedValue(comment);
      mockDelete.mockResolvedValue(comment);

      await service.deleteComment(1, { id: mockUserId, role: "STUDENT" } as Express.User);

      expect(mockFindById).toHaveBeenCalledWith(1);
      expect(mockAssertPermission).toHaveBeenCalledWith(
        { id: mockUserId, role: "STUDENT" }, "comments", "delete", comment,
      );
      expect(mockDelete).toHaveBeenCalledWith(1);
    });

    it("should throw CommentNotFoundError when comment does not exist", async () => {
      mockFindById.mockResolvedValue(null);

      await expect(
        service.deleteComment(999, { id: mockUserId } as Express.User),
      ).rejects.toThrow(CommentNotFoundError);

      expect(mockDelete).not.toHaveBeenCalled();
    });
  });
});
