export const userSchemas = {
  User: {
    type: "object",
    properties: {
      id: {
        type: "string",
        format: "uuid",
        example: "550e8400-e29b-41d4-a716-446655440000",
      },
      username: { type: "string", example: "johndoe" },
      bio: { type: "string", nullable: true, example: "I love coding!" },
      avatarUrl: {
        type: "string",
        nullable: true,
        example: "https://example.com/avatar.jpg",
      },
      role: { type: "string", enum: ["STUDENT", "ADMIN"] },
      createdAt: {
        type: "string",
        format: "date-time",
        example: "2025-08-16T12:34:56.000Z",
      },
    },
  },

  UpdateUserProfileRequest: {
    type: "object",
    properties: {
      bio: { type: "string", nullable: true, example: "I love coding!" },
      avatarUrl: {
        type: "string",
        nullable: true,
        example: "https://example.com/avatar.jpg",
      },
    },
  },

  Author: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      username: { type: "string" },
      Avatar: {
        type: "object",
        nullable: true,
        properties: {
          id: { type: "integer", example: 15 },
          url: {
            type: "string",
            example: "https://cdn.example.com/avatars/avatar1.png",
          },
        },
      },
    },
  },

  PostAuthor: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "Unique identifier for the post author",
        example: "user_111222333",
      },
      username: {
        type: "string",
        description: "Username of the post author",
        example: "tech_blogger",
      },
    },
    required: ["id", "username"],
  },
};
