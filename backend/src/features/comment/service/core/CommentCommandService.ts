import { PostNotFoundError } from "../../../../core/error/custom/post.error.js";
import { assertPermission } from "../../../../core/security/rbac.js";
import NotificationService from "../../../notification/service/NotificationService.js";
import { postService } from "../../../posts/service/PostService.js";

import type { CommentValidationService } from "./CommentValidationService.js";
import type { CommentRepository } from "../repositories/commentRepository.js";
import type { CreateCommentData } from "../types/commentTypes.js";
import type { Application } from "express";

class CommentCommandService {
  constructor(
    private readonly validation: CommentValidationService,
    private readonly repo: typeof CommentRepository,
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

  private async sendCommentNotification(
    data: {
      isReply: boolean;
      postAuthorId: string;
      parentAuthorId?: string;
      commentAuthorId: string;
      postId: string;
      commentId: number;
    },
    app?: Application,
  ) {
    if (data.isReply && data.parentAuthorId) {
      await NotificationService.createNotification(
        {
          type: "REPLY_TO_COMMENT",
          userId: data.parentAuthorId,
          actorId: data.commentAuthorId,
          postId: data.postId,
          commentId: data.commentId,
        },
        app,
      );
    } else {
      await NotificationService.createNotification(
        {
          type: "COMMENT_ON_POST",
          userId: data.postAuthorId,
          actorId: data.commentAuthorId,
          postId: data.postId,
          commentId: data.commentId,
        },
        app,
      );
    }
  }

  async createComment(data: CreateCommentData, app?: Application) {
    const post = await postService.validate.verifyPostExists(data.postId);
    if (!post) {
      throw new PostNotFoundError(data.postId);
    }

    let finalParentId: number | null = null;
    let mentionedUserId: string | undefined;
    let parentAuthorId: string | undefined;

    if (data.parentId) {
      const parentComment =
        await this.validation.validateParentComment(
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

    await this.sendCommentNotification(
      {
        isReply: !!data.parentId,
        postAuthorId: post.authorId,
        parentAuthorId,
        commentAuthorId: data.authorId,
        postId: data.postId,
        commentId: newComment.id,
      },
      app,
    );

    return newComment;
  }

  async deleteComment(commentId: number, user: Express.User) {
    const comment = await this.validation.commentExists(commentId);

    assertPermission(user, "comments", "delete", comment);

    await this.repo.delete(commentId);
  }
}

export { CommentCommandService };
