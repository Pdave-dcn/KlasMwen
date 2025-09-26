export const commentSchemas = {
  UserCommentsResponse: {
    type: "object",
    properties: {
      data: {
        type: "array",
        items: {
          $ref: "#/components/schemas/CommentWithRelations",
        },
        description: "Array of user comments and replies",
      },
      pagination: {
        $ref: "#/components/schemas/PaginationInfo",
      },
    },
    required: ["data", "pagination"],
  },

  CommentWithRelations: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "Unique identifier for the comment",
        example: "comment_123456789",
      },
      content: {
        type: "string",
        description: "The comment text content",
        example: "This is a great post! Thanks for sharing your insights.",
      },
      createdAt: {
        type: "string",
        format: "date-time",
        description: "ISO 8601 timestamp when the comment was created",
        example: "2024-01-15T10:30:00.000Z",
      },
      author: {
        $ref: "#/components/schemas/CommentAuthor",
      },
      post: {
        $ref: "#/components/schemas/CommentPost",
      },
      parentComment: {
        oneOf: [
          { $ref: "#/components/schemas/ParentComment" },
          { type: "null" },
        ],
        description: "Parent comment if this is a reply, null otherwise",
      },
      isReply: {
        type: "boolean",
        description:
          "Indicates whether this comment is a reply to another comment",
        example: false,
      },
    },
    required: [
      "id",
      "content",
      "createdAt",
      "author",
      "post",
      "parentComment",
      "isReply",
    ],
  },

  CommentAuthor: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "Unique identifier for the comment author",
        example: "user_987654321",
      },
      username: {
        type: "string",
        description: "Username of the comment author",
        example: "john_doe",
      },
      avatar: {
        oneOf: [{ $ref: "#/components/schemas/Avatar" }, { type: "null" }],
        description: "Author's avatar information, null if no avatar is set",
      },
    },
    required: ["id", "username", "avatar"],
  },

  CommentPost: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "Unique identifier for the post",
        example: "post_456789123",
      },
      title: {
        type: "string",
        description: "Title of the post",
        example: "Understanding Modern Web Development",
      },
      content: {
        oneOf: [{ type: "string" }, { type: "null" }],
        description:
          "Truncated content of the post (max 150 characters), null if no content",
        example:
          "In today's rapidly evolving tech landscape, web development has become more complex and exciting than ever. From frameworks...",
      },
      author: {
        $ref: "#/components/schemas/PostAuthor",
      },
    },
    required: ["id", "title", "content", "author"],
  },

  ParentComment: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "Unique identifier for the parent comment",
        example: "comment_555666777",
      },
      content: {
        type: "string",
        description:
          "Truncated content of the parent comment (max 100 characters)",
        example:
          "What do you think about the new useEffect patterns that have emerged recently? I've been experimenting...",
      },
      author: {
        $ref: "#/components/schemas/PostAuthor",
      },
    },
    required: ["id", "content", "author"],
  },

  BaseCommentResponse: {
    type: "object",
    properties: {
      id: { type: "integer", example: 123 },
      content: { type: "string", example: "This is a comment" },
      author: { $ref: "#/components/schemas/Author" },
      createdAt: {
        type: "string",
        format: "date-time",
        example: "2025-08-16 12:34:56",
      },
    },
  },

  Comment: {
    type: "object",
    properties: {
      id: { type: "integer", example: 123 },
      content: { type: "string", example: "This is a comment or reply" },
      author: { $ref: "#/components/schemas/Author" },
      postId: {
        type: "string",
        format: "uuid",
        example: "550e8400-e29b-41d4-a716-446655440000",
      },
      parentId: { type: "integer", nullable: true, example: 122 },
      createdAt: {
        type: "string",
        format: "date-time",
        example: "2025-08-16T12:34:56.000Z",
      },
    },
  },

  Reply: {
    type: "object",
    properties: {
      id: { type: "integer", example: 123 },
      content: { type: "string", example: "This is a reply" },
      author: { $ref: "#/components/schemas/Author" },
      createdAt: {
        type: "string",
        format: "date-time",
        example: "2025-08-16 12:34:56",
      },
    },
  },

  CreateCommentRequest: {
    type: "object",
    properties: {
      content: { type: "string", example: "This is a comment" },
      parentId: { type: "integer", nullable: true, example: 122 },
    },
    required: ["content"],
  },

  CommentCreatedResponse: {
    type: "object",
    properties: {
      message: {
        type: "string",
        example: "Comment created successfully",
      },
      data: { $ref: "#/components/schemas/Comment" },
    },
  },

  ParentCommentsResponse: {
    type: "object",
    properties: {
      data: {
        type: "array",
        items: { $ref: "#/components/schemas/BaseCommentResponse" },
      },
      pagination: {
        type: "object",
        properties: {
          hasMore: { type: "boolean" },
          nextCursor: { type: "number", nullable: true, example: 21 },
          totalComments: { type: "number", example: 456 },
        },
      },
    },
  },

  RepliesResponse: {
    type: "object",
    properties: {
      data: {
        type: "array",
        items: { $ref: "#/components/schemas/Reply" },
      },
      pagination: {
        type: "object",
        properties: {
          nextCursor: { type: "integer", nullable: true, example: 456 },
          hasMore: { type: "boolean", example: true },
        },
      },
    },
  },
};
