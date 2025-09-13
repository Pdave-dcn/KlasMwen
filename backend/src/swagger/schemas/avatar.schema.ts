export const avatarSchemas = {
  Avatar: {
    type: "object",
    properties: {
      id: {
        type: "integer",
        description: "Unique identifier for the avatar",
        example: 1,
      },
      url: {
        type: "string",
        format: "uri",
        description: "URL pointing to the avatar image",
        example: "https://cdn.example.com/avatars/avatar1.png",
      },
      isDefault: {
        type: "boolean",
        description: "Whether this avatar is a default avatar",
        example: false,
      },
    },
    required: ["id", "url", "isDefault"],
  },

  CreateAvatarRequest: {
    type: "object",
    properties: {
      url: {
        type: "string",
        format: "uri",
        description: "URL pointing to the avatar image",
        example: "https://cdn.example.com/avatars/new-avatar.png",
      },
      isDefault: {
        type: "boolean",
        description: "Whether this avatar should be a default avatar",
        default: false,
        example: false,
      },
    },
    required: ["url"],
  },

  PaginatedAvatarsResponse: {
    type: "object",
    properties: {
      data: {
        type: "array",
        items: {
          $ref: "#/components/schemas/Avatar",
        },
      },
      pagination: {
        type: "object",
        properties: {
          hasMore: {
            type: "boolean",
            description: "Whether there are more items available",
            example: true,
          },
          nextCursor: {
            type: "integer",
            nullable: true,
            description: "Cursor for the next page (null if no more pages)",
            example: 25,
          },
        },
        required: ["hasMore", "nextCursor"],
      },
    },
    required: ["data", "pagination"],
  },

  AvatarCreateResponse: {
    type: "object",
    properties: {
      message: {
        type: "string",
        example: "Avatar(s) added successfully",
      },
      data: {
        oneOf: [
          {
            $ref: "#/components/schemas/Avatar",
          },
          {
            type: "object",
            properties: {
              count: {
                type: "integer",
                description: "Number of avatars created",
                example: 3,
              },
            },
          },
        ],
      },
    },
    required: ["message", "data"],
  },

  AvatarDeleteResponse: {
    type: "object",
    properties: {
      message: {
        type: "string",
        example: "Avatar deleted successfully",
      },
    },
    required: ["message"],
  },
};
