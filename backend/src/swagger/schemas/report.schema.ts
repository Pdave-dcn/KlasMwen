export const reportSchemas = {
  Reporter: {
    type: "object",
    properties: {
      id: {
        type: "string",
        format: "uuid",
        example: "60676309-9958-4a6a-b4bc-463199dab4ee",
      },
      username: { type: "string", example: "john" },
      email: { type: "string", format: "email", example: "johndoe@email.com" },
      role: { type: "string", enum: ["STUDENT", "MODERATOR", "ADMIN"] },
    },
  },

  ReportedPost: {
    type: "object",
    properties: {
      id: {
        type: "string",
        format: "uuid",
        example: "60676309-9958-4a6a-b4bc-463199dab4ee",
      },
      title: { type: "string" },
    },
  },

  ReportedComment: {
    type: "object",
    properties: {
      id: {
        type: "integer",
        example: 24,
      },
      content: { type: "string" },
    },
  },

  ReportReason: {
    type: "object",
    properties: {
      id: {
        type: "integer",
        example: 3,
      },
      label: { type: "string", example: "Harassment" },
    },
  },

  Report: {
    type: "object",
    properties: {
      id: {
        type: "integer",
        example: 7,
      },
      status: {
        type: "string",
        enum: ["PENDING", "REVIEWED", "DISMISSED"],
        example: "REVIEWED",
      },
      isContentHidden: {
        type: "boolean",
      },
      contentType: {
        type: "string",
        enum: ["post", "comment"],
      },
      moderatorNotes: {
        type: "string",
        example: "Content removed and user warned",
        nullable: true,
      },
      createdAt: {
        type: "string",
        format: "date-time",
      },
      reporter: {
        type: "object",
        properties: {
          items: {
            $ref: "#components/schemas/Reporter",
          },
        },
      },
      reason: {
        type: "object",
        properties: {
          items: {
            $ref: "#components/schemas/Reason",
          },
        },
      },
      post: {
        allOf: [
          { $ref: "#/components/schemas/ReportedPost" },
          { nullable: true },
        ],
      },
      comment: {
        allOf: [
          { $ref: "#/components/schemas/ReportedComment" },
          { nullable: true },
        ],
      },
    },
  },

  ReportsResponse: {
    type: "object",
    properties: {
      data: {
        type: "array",
        items: {
          $ref: "#components/schemas/Report",
        },
      },
    },
  },

  ReportsPaginationMetadata: {
    type: "object",
    properties: {
      total: {
        type: "integer",
        description: "Total number of reports matching the filters",
        example: 42,
      },
      page: {
        type: "integer",
        description: "Current page number",
        example: 1,
      },
      limit: {
        type: "integer",
        description: "Number of reports per page",
        example: 10,
      },
      totalPages: {
        type: "integer",
        description: "Total number of pages",
        example: 5,
      },
      hasNext: {
        type: "boolean",
        description: "Whether there is a next page",
        example: true,
      },
      hasPrevious: {
        type: "boolean",
        description: "Whether there is a previous page",
        example: false,
      },
    },
    required: [
      "total",
      "page",
      "limit",
      "totalPages",
      "hasNext",
      "hasPrevious",
    ],
  },

  PaginatedReportsResponse: {
    type: "object",
    properties: {
      data: {
        type: "array",
        items: {
          $ref: "#components/schemas/Report",
        },
      },
      pagination: {
        $ref: "#components/schemas/ReportsPaginationMetadata",
      },
    },
    required: ["data", "pagination"],
  },

  CreateReportRequest: {
    type: "object",
    properties: {
      reporterId: {
        type: "string",
        format: "uuid",
        example: "60676309-9958-4a6a-b4bc-463199dab4ee",
      },
      reasonId: { type: "integer", example: 5 },
      commentId: { type: "integer", example: 56, nullable: true },
      postId: {
        type: "string",
        format: "uuid",
        example: "f8b6e3d2-c4a0-4b1e-8f5c-9a7d3b2c1f0e",
        nullable: true,
      },
    },
  },

  Reason: {
    type: "object",
    properties: {
      id: {
        type: "integer",
        example: 1,
      },
      label: {
        type: "string",
        example: "Harassment",
      },
      description: {
        type: "string",
        example:
          "Abuse, intimidation, or malicious behavior targeting an individual or group. This includes sustained bullying, threats, doxxing, and hate speech intended to degrade or humiliate",
        nullable: true,
      },
    },
  },

  ActiveReasonsResponse: {
    type: "object",
    properties: {
      data: {
        type: "array",
        items: {
          $ref: "#components/schemas/Reason",
        },
      },
    },
  },

  UpdateReportStatusRequest: {
    type: "object",
    properties: {
      status: {
        type: "string",
        enum: ["PENDING", "REVIEWED", "DISMISSED"],
        example: "REVIEWED",
      },
      moderatorNotes: {
        type: "string",
        example: "Content removed and user warned",
        nullable: true,
      },
    },
    required: ["status"],
  },

  ToggleVisibilityRequest: {
    type: "object",
    properties: {
      resourceType: {
        type: "string",
        enum: ["post", "comment"],
        example: "post",
      },
      resourceId: {
        oneOf: [
          {
            type: "string",
            format: "uuid",
            example: "f8b6e3d2-c4a0-4b1e-8f5c-9a7d3b2c1f0e",
          },
          {
            type: "integer",
            example: 42,
          },
        ],
      },
      hidden: {
        type: "boolean",
        example: true,
      },
    },
    required: ["resourceType", "resourceId", "hidden"],
  },
};
