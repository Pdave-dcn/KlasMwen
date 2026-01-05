export const notificationSchemas = {
  Notification: {
    type: "object",
    properties: {
      id: {
        type: "integer",
        description: "Unique identifier for the notification",
        example: 123,
      },
      type: {
        type: "string",
        enum: ["COMMENT_ON_POST", "REPLY_TO_COMMENT", "LIKE", "REPORT_UPDATE"],
        description: "Type of notification",
        example: "COMMENT_ON_POST",
      },
      read: {
        type: "boolean",
        description: "Whether the notification has been read",
        example: false,
      },
      createdAt: {
        type: "string",
        format: "date-time",
        description: "Timestamp when notification was created",
        example: "2024-01-15T10:30:00Z",
      },
      userId: {
        type: "string",
        format: "uuid",
        description: "ID of the user receiving the notification",
        example: "550e8400-e29b-41d4-a716-446655440000",
      },
      actorId: {
        type: "string",
        format: "uuid",
        description: "ID of the user who triggered the notification",
        example: "650e8400-e29b-41d4-a716-446655440001",
      },
      postId: {
        type: "string",
        format: "uuid",
        nullable: true,
        description: "ID of the related post (if applicable)",
        example: "750e8400-e29b-41d4-a716-446655440002",
      },
      commentId: {
        type: "integer",
        nullable: true,
        description: "ID of the related comment (if applicable)",
        example: 456,
      },
      actor: {
        type: "object",
        description: "User who triggered the notification",
        properties: {
          id: {
            type: "string",
            format: "uuid",
            example: "650e8400-e29b-41d4-a716-446655440001",
          },
          username: {
            type: "string",
            example: "john_doe",
          },
          Avatar: {
            type: "object",
            nullable: true,
            properties: {
              url: {
                type: "string",
                format: "uri",
                example: "https://example.com/avatars/avatar1.png",
              },
            },
          },
        },
      },
      post: {
        type: "object",
        nullable: true,
        description: "Related post information",
        properties: {
          id: {
            type: "string",
            format: "uuid",
            example: "750e8400-e29b-41d4-a716-446655440002",
          },
          title: {
            type: "string",
            example: "My First Post",
          },
          type: {
            type: "string",
            enum: ["QUESTION", "NOTE", "RESOURCE"],
            example: "QUESTION",
          },
        },
      },
      comment: {
        type: "object",
        nullable: true,
        description: "Related comment information",
        properties: {
          id: {
            type: "integer",
            example: 456,
          },
          content: {
            type: "string",
            example: "This is a great post!",
          },
          postId: {
            type: "string",
            format: "uuid",
            example: "750e8400-e29b-41d4-a716-446655440002",
          },
        },
      },
    },
    required: ["id", "type", "read", "createdAt", "userId", "actorId", "actor"],
  },

  NotificationsPaginationResponse: {
    type: "object",
    properties: {
      notifications: {
        type: "array",
        items: {
          $ref: "#/components/schemas/Notification",
        },
      },
      pagination: {
        type: "object",
        properties: {
          nextCursor: {
            type: "integer",
            nullable: true,
            description: "Cursor for the next page of results",
            example: 150,
          },
          hasMore: {
            type: "boolean",
            description: "Whether there are more notifications to fetch",
            example: true,
          },
        },
        required: ["nextCursor", "hasMore"],
      },
      unreadCount: {
        type: "integer",
        description: "Total number of unread notifications",
        example: 5,
      },
    },
    required: ["notifications", "pagination", "unreadCount"],
  },

  MessageResponse: {
    type: "object",
    properties: {
      message: {
        type: "string",
        example: "Notification marked as read",
      },
    },
    required: ["message"],
  },

  NotificationError: {
    type: "object",
    properties: {
      code: {
        type: "string",
        example: "NOTIFICATION_NOT_FOUND",
      },
      message: {
        type: "string",
        example: "Notification with ID 123 not found",
      },
    },
  },

  RateLimitError: {
    type: "object",
    properties: {
      code: {
        type: "string",
        example: "RATE_LIMIT_EXCEEDED",
      },
      message: {
        type: "string",
        example: "Too many notification requests. Please slow down.",
      },
    },
  },

  ValidationError: {
    type: "object",
    properties: {
      code: {
        type: "string",
        example: "VALIDATION_ERROR",
      },
      message: {
        type: "string",
        example: "Invalid notification ID",
      },
      errors: {
        type: "array",
        items: {
          type: "object",
          properties: {
            field: {
              type: "string",
              example: "id",
            },
            message: {
              type: "string",
              example: "Invalid notification ID",
            },
          },
        },
      },
    },
  },
};
