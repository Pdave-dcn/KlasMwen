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
      email: { type: "string", format: "email", example: "johndoe@gmail.com" },
      avatar: {
        type: "object",
        nullable: true,
        properties: {
          id: {
            type: "number",
            example: 456,
          },
          url: {
            type: "string",
            example: "https://example.com/avatar.svg",
          },
        },
      },
      role: { type: "string", enum: ["STUDENT", "ADMIN"] },
      createdAt: {
        type: "string",
        format: "date-time",
        example: "2025-08-16 12:34:56",
      },
    },
  },

  UpdateUserProfileRequest: {
    type: "object",
    properties: {
      bio: { type: "string", nullable: true, example: "I love coding!" },
      avatarId: {
        type: "number",
        nullable: true,
        example: 123,
      },
    },
  },

  UpdatedUserServerResponse: {
    type: "object",
    properties: {
      message: { type: "string", example: "Profile updated successfully" },
      user: { $ref: "#/components/schemas/User" },
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
