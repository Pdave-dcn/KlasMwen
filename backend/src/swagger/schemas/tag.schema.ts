export const tagSchemas = {
  Tag: {
    type: "object",
    properties: {
      id: { type: "integer", example: 1 },
      name: { type: "string", example: "javascript" },
    },
  },

  CreateTagRequest: {
    type: "object",
    properties: {
      name: { type: "string", example: "typescript" },
    },
    required: ["name"],
  },

  TagResponse: {
    type: "object",
    properties: {
      message: { type: "string", example: "Tag created successfully" },
      data: { $ref: "#/components/schemas/Tag" },
    },
  },

  TagsResponse: {
    type: "object",
    properties: {
      data: {
        type: "array",
        items: { $ref: "#/components/schemas/Tag" },
      },
      pagination: {
        type: "object",
        properties: {
          nextCursor: { type: "integer", nullable: true, example: 45 },
          hasMore: { type: "boolean", example: true },
          totalItems: { type: "integer", example: 70 },
        },
      },
    },
  },
};
