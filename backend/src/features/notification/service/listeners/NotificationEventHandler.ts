import { eventBus } from "../../../../core/events/EventBus.js";
import { notificationService } from "../index.js";

import type {
  PostLikedEvent,
  CommentCreatedEvent,
} from "../../../../core/events/types.js";

class NotificationEventHandler {
  /**
   * Subscribe to all domain events that should trigger notifications.
   */
  register(): void {
    eventBus.on<PostLikedEvent>("post:liked", this.handlePostLiked.bind(this));
    eventBus.on<CommentCreatedEvent>(
      "comment:created",
      this.handleCommentCreated.bind(this),
    );
  }

  /**
   * Handle "post:liked" event.
   * Creates a LIKE notification for the post author.
   *
   * The notification is NOT created if the actor is the same as the
   * receiver (self-like guard).
   */
  private async handlePostLiked(event: PostLikedEvent): Promise<void> {
    const { postAuthorId, actorId, postId } = event;

    if (postAuthorId === actorId) {
      return; // Skip self-notifications
    }

    try {
      await notificationService.command.createNotification({
        type: "LIKE",
        userId: postAuthorId,
        actorId,
        postId,
      });
    } catch (error) {
      console.error("Failed to create LIKE notification:", error);
    }
  }

  /**
   * Handle "comment:created" event.
   * Creates either:
   *   - COMMENT_ON_POST notification (root comment → post author)
   *   - REPLY_TO_COMMENT notification (reply → parent comment author)
   */
  private async handleCommentCreated(
    event: CommentCreatedEvent,
  ): Promise<void> {
    const {
      commentId,
      postId,
      postAuthorId,
      commentAuthorId,
      parentCommentAuthorId,
      isReply,
    } = event;

    try {
      if (isReply && parentCommentAuthorId) {
        if (commentAuthorId === parentCommentAuthorId) {
          return; // Skip self-notifications (replying to own comment)
        }
        await notificationService.command.createNotification({
          type: "REPLY_TO_COMMENT",
          userId: parentCommentAuthorId,
          actorId: commentAuthorId,
          postId,
          commentId,
        });
      } else {
        if (commentAuthorId === postAuthorId) {
          return; // Skip self-notifications (commenting on own post)
        }
        await notificationService.command.createNotification({
          type: "COMMENT_ON_POST",
          userId: postAuthorId,
          actorId: commentAuthorId,
          postId,
          commentId,
        });
      }
    } catch (error) {
      console.error("Failed to create comment notification:", error);
    }
  }
}

const notificationEventHandler = new NotificationEventHandler();
export { notificationEventHandler, NotificationEventHandler };
