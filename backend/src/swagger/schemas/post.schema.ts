export const postSchemas = {
  Post: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      title: { type: "string" },
      content: { type: "string" },
      type: { type: "string", enum: ["NOTE", "QUESTION", "RESOURCE"] },
      fileUrl: { type: "string", nullable: true },
      fileName: { type: "string", nullable: true },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
      author: { $ref: "#/components/schemas/Author" },
      tags: {
        type: "array",
        items: { $ref: "#/components/schemas/Tag" },
      },
      _count: {
        type: "object",
        properties: {
          comments: { type: "integer" },
          likes: { type: "integer" },
        },
      },
    },
  },

  PostWithBookmarkAndLikeStates: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      title: { type: "string" },
      content: { type: "string" },
      type: { type: "string", enum: ["NOTE", "QUESTION", "RESOURCE"] },
      fileUrl: { type: "string", nullable: true },
      fileName: { type: "string", nullable: true },
      createdAt: { type: "string", format: "date-time" },
      isBookmarked: { type: "boolean" },
      isLiked: { type: "boolean" },
      author: { $ref: "#/components/schemas/Author" },
      tags: {
        type: "array",
        items: { $ref: "#/components/schemas/Tag" },
      },
      _count: {
        type: "object",
        properties: {
          comments: { type: "integer" },
          likes: { type: "integer" },
        },
      },
    },
  },

  SinglePostResponse: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      title: { type: "string" },
      content: { type: "string" },
      type: { type: "string", enum: ["NOTE", "QUESTION", "RESOURCE"] },
      fileUrl: { type: "string", nullable: true },
      fileName: { type: "string", nullable: true },
      fileSize: { type: "number", nullable: true },
      createdAt: { type: "string", format: "date-time" },
      author: { $ref: "#/components/schemas/Author" },
      isBookmarked: { type: "boolean" },
      isLiked: { type: "boolean" },
      tags: {
        type: "array",
        items: { $ref: "#/components/schemas/Tag" },
      },
      _count: {
        type: "object",
        properties: {
          comments: { type: "integer" },
          likes: { type: "integer" },
        },
      },
    },
  },

  PostMetadata: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      title: { type: "string" },
      type: { type: "string" },
      fileUrl: { type: "string", nullable: true },
      fileName: { type: "string", nullable: true },
      fileSize: { type: "integer", nullable: true },
      mimeType: { type: "string", nullable: true },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
      authorId: { type: "string", format: "uuid" },
      author: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          username: { type: "string" },
          email: { type: "string", format: "email" },
        },
      },
      _count: {
        type: "object",
        properties: {
          comments: { type: "integer" },
          likes: { type: "integer" },
        },
      },
    },
  },

  CreatePostRequest: {
    type: "object",
    properties: {
      title: { type: "string" },
      content: { type: "string" },
      type: { type: "string", enum: ["NOTE", "QUESTION", "RESOURCE"] },
      tagIds: {
        type: "array",
        items: { type: "integer" },
      },
      resource: {
        type: "string",
        format: "binary",
        description: "Optional file upload for RESOURCE posts",
      },
    },
    required: ["title", "content", "type"],
  },

  UpdatePostRequest: {
    type: "object",
    properties: {
      title: { type: "string" },
      content: { type: "string" },
      type: { type: "string", enum: ["NOTE", "QUESTION", "RESOURCE"] },
      tagIds: {
        type: "array",
        items: { type: "integer" },
      },
    },
  },

  PostResponse: {
    type: "object",
    properties: {
      message: { type: "string" },
      data: { $ref: "#/components/schemas/Post" },
    },
  },

  PostsResponse: {
    type: "object",
    properties: {
      data: {
        type: "array",
        items: { $ref: "#/components/schemas/PostWithBookmarkAndLikeStates" },
      },
      pagination: {
        type: "object",
        properties: {
          hasMore: { type: "boolean" },
          nextCursor: { type: "string", nullable: true },
        },
      },
    },
  },
};
