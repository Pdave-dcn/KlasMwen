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

interface ReportStatusUpdatedEvent {
  type: "report:status_updated";
  reportId: string;
  reportedUserId: string;
  updatedBy: string;
  newStatus: string;
}

// Union of all events — add new event types here
type NotificationEvent =
  | PostLikedEvent
  | CommentCreatedEvent
  | ReportStatusUpdatedEvent;

export type {
  NotificationEvent,
  PostLikedEvent,
  CommentCreatedEvent,
  ReportStatusUpdatedEvent,
};
