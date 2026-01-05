import { PostNotFoundError } from "../../../../core/error/custom/post.error.js";
import { assertPermission } from "../../../../core/security/rbac.js";
import NotificationService from "../../../notification/service/NotificationService.js";
import { PostValidationService } from "../../../posts/service/core/PostValidationService.js";
import CommentRepository from "../commentRepository.js";

import CommentValidationService from "./CommentValidationService.js";

import type { CreateCommentData } from "../types.js";
import type { Application } from "express";

/**
 * CommentCommandService - Write operations only
 */
class CommentCommandService {
  /**
   * Determines the final parent ID and mentioned user for nested replies
   */
  private static resolveCommentHierarchy(parentComment: {
    id: number;
    parentId: number | null;
    authorId: string;
  }) {
    if (parentComment.parentId) {
      // Reply to a reply - flatten to 2 levels
      return {
        finalParentId: parentComment.parentId,
        mentionedUserId: parentComment.authorId,
        parentAuthorId: parentComment.authorId,
      };
    } else {
      // Reply to a root comment
      return {
        finalParentId: parentComment.id,
        mentionedUserId: undefined,
        parentAuthorId: parentComment.authorId,
      };
    }
  }

  /**
   * Sends appropriate notification based on comment type
   */
  private static async sendCommentNotification(
    data: {
      isReply: boolean;
      postAuthorId: string;
      parentAuthorId?: string;
      commentAuthorId: string;
      postId: string;
      commentId: number;
    },
    app?: Application
  ) {
    if (data.isReply && data.parentAuthorId) {
      // Notify parent comment author
      await NotificationService.createNotification(
        {
          type: "REPLY_TO_COMMENT",
          userId: data.parentAuthorId,
          actorId: data.commentAuthorId,
          postId: data.postId,
          commentId: data.commentId,
        },
        app
      );
    } else {
      // Notify post author
      await NotificationService.createNotification(
        {
          type: "COMMENT_ON_POST",
          userId: data.postAuthorId,
          actorId: data.commentAuthorId,
          postId: data.postId,
          commentId: data.commentId,
        },
        app
      );
    }
  }

  /**
   * Create a new comment with validation
   */
  static async createComment(data: CreateCommentData, app?: Application) {
    // Verify post exists
    const post = await PostValidationService.verifyPostExists(data.postId);
    if (!post) {
      throw new PostNotFoundError(data.postId);
    }

    let finalParentId: number | null = null;
    let mentionedUserId: string | undefined;
    let parentAuthorId: string | undefined;

    // Handle parent comment logic if this is a reply
    if (data.parentId) {
      const parentComment =
        await CommentValidationService.validateParentComment(
          data.parentId,
          data.postId
        );

      const hierarchy = this.resolveCommentHierarchy(parentComment);
      finalParentId = hierarchy.finalParentId;
      mentionedUserId = hierarchy.mentionedUserId;
      parentAuthorId = hierarchy.parentAuthorId;
    }

    // Create the comment
    const newComment = await CommentRepository.create({
      content: data.content,
      author: { connect: { id: data.authorId } },
      post: { connect: { id: data.postId } },
      ...(finalParentId && { parent: { connect: { id: finalParentId } } }),
      ...(mentionedUserId && {
        mentionedUser: { connect: { id: mentionedUserId } },
      }),
    });

    // Send notification
    await this.sendCommentNotification(
      {
        isReply: !!data.parentId,
        postAuthorId: post.authorId,
        parentAuthorId,
        commentAuthorId: data.authorId,
        postId: data.postId,
        commentId: newComment.id,
      },
      app
    );

    return newComment;
  }

  /**
   * Delete a comment with permission checks
   */
  static async deleteComment(commentId: number, user: Express.User) {
    const comment = await CommentValidationService.commentExists(commentId);

    assertPermission(user, "comments", "delete", comment);

    await CommentRepository.delete(commentId);
  }
}

export default CommentCommandService;
