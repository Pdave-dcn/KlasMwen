export const commonParameters = {
  LimitParam: {
    name: "limit",
    in: "query",
    description: "Number of items to return per page",
    required: false,
    schema: {
      type: "integer",
      minimum: 1,
      maximum: 60,
      default: 20,
      example: 20,
    },
  },

  CursorParam: {
    name: "cursor",
    in: "query",
    description:
      "Cursor for pagination (ID of the last item from previous page)",
    required: false,
    schema: {
      type: "string",
      example: "cursor_123456",
    },
  },

  UserIdParam: {
    name: "id",
    in: "path",
    required: true,
    description: "The unique identifier of the user",
    schema: {
      type: "string",
      format: "uuid",
      example: "123e4567-e89b-12d3-a456-426614174000",
    },
  },

  AvatarIdParam: {
    name: "id",
    in: "path",
    required: true,
    description: "The unique identifier of the avatar",
    schema: {
      type: "integer",
      minimum: 1,
      example: 5,
    },
  },
};
