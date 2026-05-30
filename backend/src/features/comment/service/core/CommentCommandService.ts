import { PostNotFoundError } from "../../../../core/error/custom/post.error.js";
import { eventBus } from "../../../../core/events/EventBus.js";
import {
  permissionService as defaultPermissionService,
  type PermissionService,
} from "../../../../core/security/PermissionService.js";
import { postService } from "../../../posts/service/PostService.js";

import type { CommentValidationService } from "./CommentValidationService.js";
import type { CommentCreatedEvent } from "../../../../core/events/types.js";
import type { CommentRepository } from "../repositories/commentRepository.js";
import type { CreateCommentData } from "../types/commentTypes.js";

class CommentCommandService {
  constructor(
    private readonly validation: CommentValidationService,
    private readonly repo: typeof CommentRepository,
    private readonly permission: PermissionService = defaultPermissionService,
  ) {}

  private resolveCommentHierarchy(parentComment: {
    id: number;
    parentId: number | null;
    authorId: string;
  }) {
    if (parentComment.parentId) {
      return {
        finalParentId: parentComment.parentId,
        mentionedUserId: parentComment.authorId,
        parentAuthorId: parentComment.authorId,
      };
    } else {
      return {
        finalParentId: parentComment.id,
        mentionedUserId: undefined,
        parentAuthorId: parentComment.authorId,
      };
    }
  }

  async createComment(data: CreateCommentData) {
    const post = await postService.validate.verifyPostExists(data.postId);
    if (!post) {
      throw new PostNotFoundError(data.postId);
    }

    let finalParentId: number | null = null;
    let mentionedUserId: string | undefined;
    let parentAuthorId: string | undefined;

    if (data.parentId) {
      const parentComment = await this.validation.validateParentComment(
        data.parentId,
        data.postId,
      );

      const hierarchy = this.resolveCommentHierarchy(parentComment);
      finalParentId = hierarchy.finalParentId;
      mentionedUserId = hierarchy.mentionedUserId;
      parentAuthorId = hierarchy.parentAuthorId;
    }

    const newComment = await this.repo.create({
      content: data.content,
      author: { connect: { id: data.authorId } },
      post: { connect: { id: data.postId } },
      ...(finalParentId && { parent: { connect: { id: finalParentId } } }),
      ...(mentionedUserId && {
        mentionedUser: { connect: { id: mentionedUserId } },
      }),
    });

    const event: CommentCreatedEvent = {
      type: "comment:created",
      commentId: newComment.id,
      postId: data.postId,
      postAuthorId: post.authorId,
      commentAuthorId: data.authorId,
      parentCommentAuthorId: parentAuthorId ?? null,
      isReply: !!data.parentId,
    };
    eventBus.emit(event);

    return newComment;
  }

  async deleteComment(commentId: number, user: Express.User) {
    const comment = await this.validation.commentExists(commentId);

    this.permission.assertCanDeleteComment(user, comment);

    await this.repo.delete(commentId);
  }
}

export { CommentCommandService };
