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

  PostWithComments: {
    allOf: [
      { $ref: "#/components/schemas/Post" },
      {
        type: "object",
        properties: {
          comments: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "integer" },
                content: { type: "string" },
                createdAt: { type: "string", format: "date-time" },
                author: { $ref: "#/components/schemas/Author" },
              },
            },
          },
          commentsPagination: {
            type: "object",
            properties: {
              hasMore: { type: "boolean" },
              nextCursor: { type: "integer", nullable: true },
              totalComments: { type: "integer" },
            },
          },
        },
      },
    ],
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
        items: { $ref: "#/components/schemas/Post" },
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

  BookmarksResponse: {
    type: "object",
    properties: {
      data: {
        type: "array",
        items: {
          $ref: "#/components/schemas/Post",
        },
      },
      pagination: {
        type: "object",
        properties: {
          hasMore: {
            type: "boolean",
            description: "Whether there are more results available",
            example: true,
          },
          nextCursor: {
            type: "string",
            format: "uuid",
            nullable: true,
            description: "Cursor for the next page of results",
            example: "660e8400-e29b-41d4-a716-446655440001",
          },
        },
      },
    },
  },
};
