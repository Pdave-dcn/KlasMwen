interface PostLikedEvent {
  type: "post:liked";
  postId: string;
  postAuthorId: string;
  actorId: string;
}

interface CommentCreatedEvent {
  type: "comment:created";
  commentId: number;
  postId: string;
  postAuthorId: string;
  commentAuthorId: string;
  parentCommentAuthorId: string | null;
  isReply: boolean;
}

// Union of all events — add new event types here
type NotificationEvent =
  | PostLikedEvent
  | CommentCreatedEvent;

export type {
  NotificationEvent,
  PostLikedEvent,
  CommentCreatedEvent,
};
