export const commonSchemas = {
  ErrorResponse: {
    type: "object",
    properties: {
      message: {
        type: "string",
        description: "Human-readable error message",
        example: "User not found",
      },
      error: {
        type: "string",
        description: "Error type or code (optional)",
        example: "NOT_FOUND",
      },
    },
    required: ["message"],
  },

  PaginationInfo: {
    type: "object",
    properties: {
      hasMore: {
        type: "boolean",
        description: "Indicates if there are more results available",
        example: true,
      },
      nextCursor: {
        oneOf: [{ type: "string" }, { type: "integer" }, { type: "null" }],
        description:
          "Cursor for the next page of results, null if no more pages",
        example: "comment_987654321",
      },
    },
    required: ["hasMore", "nextCursor"],
  },

  Pagination: {
    type: "object",
    properties: {
      nextCursor: { type: "integer", nullable: true, example: 456 },
      hasNextPage: { type: "boolean", example: true },
      totalItems: { type: "integer", example: 25 },
    },
  },
};
