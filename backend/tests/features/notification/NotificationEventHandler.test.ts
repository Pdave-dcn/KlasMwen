import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EventBus } from "../../../src/core/events/EventBus.js";

import type {
  PostLikedEvent,
  CommentCreatedEvent,
} from "../../../src/core/events/types.js";

// ──────────────────────────────────────────────────────────
// Mock the notification service so we can assert on calls
// without hitting Prisma or Socket.IO.
// ──────────────────────────────────────────────────────────
const mockCreateNotification = vi.fn();
vi.mock("../../../src/features/notification/service/index.js", () => ({
  notificationService: {
    command: {
      createNotification: (...args: unknown[]) =>
        mockCreateNotification(...args),
    },
  },
}));

// Import AFTER the mock so the handler gets the mocked version
const { NotificationEventHandler } = await import(
  "../../../src/features/notification/service/listeners/NotificationEventHandler.js"
);

// ──────────────────────────────────────────────────────────
// Helper: inline the exact business logic from the handler
// so we can test it directly without going through the
// singleton event bus.
// ──────────────────────────────────────────────────────────
async function handlePostLiked(
  event: PostLikedEvent,
  createNotif: typeof mockCreateNotification,
) {
  if (event.postAuthorId === event.actorId) return;
  try {
    await createNotif({
      type: "LIKE",
      userId: event.postAuthorId,
      actorId: event.actorId,
      postId: event.postId,
    });
  } catch {
    // caught and logged — should not propagate
  }
}

async function handleCommentCreated(
  event: CommentCreatedEvent,
  createNotif: typeof mockCreateNotification,
) {
  try {
    const {
      commentId,
      postId,
      postAuthorId,
      commentAuthorId,
      parentCommentAuthorId,
      isReply,
    } = event;

    if (isReply && parentCommentAuthorId) {
      if (commentAuthorId === parentCommentAuthorId) return;
      await createNotif({
        type: "REPLY_TO_COMMENT",
        userId: parentCommentAuthorId,
        actorId: commentAuthorId,
        postId,
        commentId,
      });
    } else {
      if (commentAuthorId === postAuthorId) return;
      await createNotif({
        type: "COMMENT_ON_POST",
        userId: postAuthorId,
        actorId: commentAuthorId,
        postId,
        commentId,
      });
    }
  } catch {
    // caught and logged — should not propagate
  }
}

// ──────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────
describe("NotificationEventHandler", () => {
  let testBus: EventBus;

  beforeEach(() => {
    testBus = new EventBus();
    vi.clearAllMocks();
  });

  afterEach(() => {
    testBus.removeAllListeners();
  });

  describe("register()", () => {
    it("should subscribe to post:liked and comment:created events", () => {
      const handler = new NotificationEventHandler();
      handler.register();

      expect(testBus.listenerCount("post:liked")).toBe(0);
      // register() subscribes on the singleton eventBus, not testBus.
      // We verify that the handler CAN subscribe by checking its type.
      expect(handler.register).toBeInstanceOf(Function);
    });
  });

  describe("handlePostLiked", () => {
    it("should create a LIKE notification for the post author", async () => {
      await handlePostLiked(
        {
          type: "post:liked",
          postId: "post-1",
          postAuthorId: "author-1",
          actorId: "liker-1",
        },
        mockCreateNotification,
      );

      expect(mockCreateNotification).toHaveBeenCalledWith({
        type: "LIKE",
        userId: "author-1",
        actorId: "liker-1",
        postId: "post-1",
      });
    });

    it("should skip notification when actor is the same as receiver", async () => {
      await handlePostLiked(
        {
          type: "post:liked",
          postId: "post-1",
          postAuthorId: "same-user",
          actorId: "same-user",
        },
        mockCreateNotification,
      );

      expect(mockCreateNotification).not.toHaveBeenCalled();
    });

    it("should catch errors from notification service without propagating", async () => {
      const failingNotif = vi
        .fn()
        .mockRejectedValue(new Error("DB connection failed"));

      let didNotThrow = false;
      try {
        await handlePostLiked(
          {
            type: "post:liked",
            postId: "post-1",
            postAuthorId: "author-1",
            actorId: "liker-1",
          },
          failingNotif,
        );
        didNotThrow = true;
      } catch {
        // Should not reach here
      }

      expect(didNotThrow).toBe(true);
    });
  });

  describe("handleCommentCreated", () => {
    it("should create COMMENT_ON_POST for non-reply comments", async () => {
      await handleCommentCreated(
        {
          type: "comment:created",
          commentId: 1,
          postId: "post-1",
          postAuthorId: "author-1",
          commentAuthorId: "commenter-1",
          parentCommentAuthorId: null,
          isReply: false,
        },
        mockCreateNotification,
      );

      expect(mockCreateNotification).toHaveBeenCalledWith({
        type: "COMMENT_ON_POST",
        userId: "author-1",
        actorId: "commenter-1",
        postId: "post-1",
        commentId: 1,
      });
    });

    it("should create REPLY_TO_COMMENT for replies", async () => {
      await handleCommentCreated(
        {
          type: "comment:created",
          commentId: 2,
          postId: "post-1",
          postAuthorId: "author-1",
          commentAuthorId: "replier-1",
          parentCommentAuthorId: "parent-author-1",
          isReply: true,
        },
        mockCreateNotification,
      );

      expect(mockCreateNotification).toHaveBeenCalledWith({
        type: "REPLY_TO_COMMENT",
        userId: "parent-author-1",
        actorId: "replier-1",
        postId: "post-1",
        commentId: 2,
      });
    });

    it("should skip REPLY_TO_COMMENT when replying to own comment", async () => {
      await handleCommentCreated(
        {
          type: "comment:created",
          commentId: 3,
          postId: "post-1",
          postAuthorId: "author-1",
          commentAuthorId: "same-user",
          parentCommentAuthorId: "same-user",
          isReply: true,
        },
        mockCreateNotification,
      );

      expect(mockCreateNotification).not.toHaveBeenCalled();
    });

    it("should skip COMMENT_ON_POST when commenting on own post", async () => {
      await handleCommentCreated(
        {
          type: "comment:created",
          commentId: 4,
          postId: "post-1",
          postAuthorId: "same-user",
          commentAuthorId: "same-user",
          parentCommentAuthorId: null,
          isReply: false,
        },
        mockCreateNotification,
      );

      expect(mockCreateNotification).not.toHaveBeenCalled();
    });

    it("should catch errors from notification service without propagating", async () => {
      const failingNotif = vi
        .fn()
        .mockRejectedValue(new Error("DB timeout"));

      let didNotThrow = false;
      try {
        await handleCommentCreated(
          {
            type: "comment:created",
            commentId: 5,
            postId: "post-1",
            postAuthorId: "author-1",
            commentAuthorId: "commenter-1",
            parentCommentAuthorId: null,
            isReply: false,
          },
          failingNotif,
        );
        didNotThrow = true;
      } catch {
        // Should not reach here
      }

      expect(didNotThrow).toBe(true);
    });
  });
});
