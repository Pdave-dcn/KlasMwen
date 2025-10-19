export const searchSchemas = {
  SearchPagination: {
    type: "object",
    properties: {
      hasMore: {
        type: "boolean",
        example: false,
        description: "Whether there are more results available",
      },
      nextCursor: {
        type: "string",
        format: "uuid",
        nullable: true,
        example: null,
        description: "Cursor for the next page (null if no more results)",
      },
    },
  },

  SearchMeta: {
    type: "object",
    properties: {
      searchTerm: {
        type: "string",
        example: "javascript",
        description: "The search term that was used",
      },
      resultsFound: {
        type: "integer",
        example: 25,
        description: "Total number of posts matching the search criteria",
      },
      currentPageSize: {
        type: "integer",
        example: 2,
        description: "Number of posts returned in this response",
      },
    },
  },

  SearchPostsResponse: {
    type: "object",
    properties: {
      data: {
        type: "array",
        items: { $ref: "#/components/schemas/PostWithBookmarkAndLikeStates" },
      },
      pagination: {
        $ref: "#/components/schemas/SearchPagination",
      },
      meta: {
        $ref: "#/components/schemas/SearchMeta",
      },
    },
  },
};
