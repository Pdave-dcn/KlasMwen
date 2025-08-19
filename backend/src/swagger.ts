import path from "path";
import { fileURLToPath } from "url";

import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

import type { Express } from "express";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "KlasMwen API",
      version: "1.0.0",
      description: "API documentation with Swagger",
    },
    servers: [
      {
        url: "http://localhost:3000/api",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter JWT token in format: Bearer <token>",
        },
      },

      schemas: {
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
            avatarUrl: { type: "string", nullable: true },
          },
        },

        Tag: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            name: { type: "string", example: "javascript" },
          },
        },

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
                pagination: {
                  type: "object",
                  properties: {
                    hasMore: { type: "boolean" },
                    nextCursor: { type: "string", nullable: true },
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

        Comment: {
          type: "object",
          properties: {
            id: { type: "integer", example: 123 },
            content: { type: "string", example: "This is a comment or reply" },
            author: { $ref: "#components/schemas/Author" },
            postId: {
              type: "string",
              format: "uuid",
              example: "550e8400-e29b-41d4-a716-446655440000",
            },
            parentId: { type: "integer", nullable: true, example: 122 },
            createdAt: {
              type: "string",
              format: "date-time",
              example: "2025-08-16T12:34:56.000Z",
            },
          },
        },

        CreateCommentRequest: {
          type: "object",
          properties: {
            content: { type: "string", example: "This is a comment" },
            parentId: { type: "integer", nullable: true, example: 122 },
          },
          required: ["content"],
        },
        CommentCreatedResponse: {
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "Comment created successfully",
            },
            data: { $ref: "#/components/schemas/Comment" },
          },
        },

        Pagination: {
          type: "object",
          properties: {
            nextCursor: { type: "integer", nullable: true, example: 456 },
            hasNextPage: { type: "boolean", example: true },
            totalItems: { type: "integer", example: 25 },
          },
        },

        CommentsResponse: {
          type: "object",
          properties: {
            data: {
              type: "array",
              items: { $ref: "#/components/schemas/Comment" },
            },
            pagination: { $ref: "#/components/schemas/Pagination" },
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
            pagination: { $ref: "#/components/schemas/Pagination" },
          },
        },

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
            total: {
              type: "integer",
              example: 2,
              description: "Number of posts returned in current page",
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
              items: { $ref: "#/components/schemas/Post" },
            },
            pagination: {
              $ref: "#/components/schemas/SearchPagination",
            },
            meta: {
              $ref: "#/components/schemas/SearchMeta",
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
      },
    },
    tags: [
      { name: "Auth", description: "Operations related to auth" },
      { name: "Bookmarks", description: "Operations related to bookmarking" },
      { name: "Comments", description: "Operations related to comments" },
      { name: "Posts", description: "Operations related to posts" },
      { name: "Reactions", description: "Operations related to reactions" },
      { name: "Search", description: "Operations related to searching" },
      { name: "Tags", description: "Operations related to tags" },
      { name: "Users", description: "Operations related to users" },
    ],
  },
  apis: [
    path.join(__dirname, "./routes/**/*.ts"),
    path.join(__dirname, "./routes/**/*.js"),
  ],
};

const swaggerSpec = swaggerJSDoc(options);

export default function setupSwagger(app: Express) {
  app.use(
    "/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      swaggerOptions: {
        supportedSubmitMethods: [],
      },
    })
  );
  app.get("/swagger.json", (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });
}
