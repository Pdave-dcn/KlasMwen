import { describe, it, expect } from "vitest";
import { ZodError } from "zod";

import { ResourcePostInput, TextPostInput } from "../../src/types/postTypes.js";
import {
  NewPostRequestSchema,
  CompletePostSchema,
  PostIdParamSchema,
  UpdatedPostSchema,
} from "../../src/zodSchemas/post.zod.js";

describe("Post Validation Schemas", () => {
  describe("NewPostRequestSchema", () => {
    describe("Text Posts (QUESTION/NOTE)", () => {
      it("should validate valid QUESTION post", () => {
        const validQuestion = {
          title: "How to use React hooks?",
          type: "QUESTION",
          content: "I am struggling with understanding useEffect hook...",
          tagIds: [1, 2, 3],
        };

        const result = NewPostRequestSchema.parse(validQuestion);
        expect(result).toEqual(validQuestion);
      });

      it("should validate valid NOTE post", () => {
        const validNote = {
          title: "React Best Practices",
          type: "NOTE",
          content: "Here are some important React best practices to follow...",
        };

        const result = NewPostRequestSchema.parse(validNote);
        expect(result).toEqual({
          ...validNote,
          tagIds: [], // Default value
        });
      });

      it("should trim whitespace from title and content", () => {
        const postWithWhitespace = {
          title: "  How to use React?  ",
          type: "QUESTION",
          content: "  This is my question content  ",
        };

        const result = NewPostRequestSchema.parse(
          postWithWhitespace
        ) as TextPostInput;
        expect(result.title).toBe("How to use React?");
        expect(result.content).toBe("This is my question content");
      });

      it("should reject title shorter than 5 characters", () => {
        const invalidPost = {
          title: "Hi",
          type: "QUESTION",
          content: "This is a valid content with enough characters",
        };

        expect(() => NewPostRequestSchema.parse(invalidPost)).toThrow(ZodError);
      });

      it("should reject title longer than 100 characters", () => {
        const longTitle = "a".repeat(101);
        const invalidPost = {
          title: longTitle,
          type: "QUESTION",
          content: "This is a valid content",
        };

        expect(() => NewPostRequestSchema.parse(invalidPost)).toThrow(ZodError);
      });

      it("should reject content shorter than 10 characters", () => {
        const invalidPost = {
          title: "Valid title here",
          type: "QUESTION",
          content: "Short",
        };

        expect(() => NewPostRequestSchema.parse(invalidPost)).toThrow(ZodError);
      });

      it("should reject content longer than 10000 characters", () => {
        const longContent = "a".repeat(10001);
        const invalidPost = {
          title: "Valid title here",
          type: "QUESTION",
          content: longContent,
        };

        expect(() => NewPostRequestSchema.parse(invalidPost)).toThrow(ZodError);
      });

      it("should reject invalid post types", () => {
        const invalidPost = {
          title: "Valid title",
          type: "INVALID_TYPE",
          content: "Valid content here",
        };

        expect(() => NewPostRequestSchema.parse(invalidPost)).toThrow(ZodError);
      });

      it("should reject more than 10 tags", () => {
        const invalidPost = {
          title: "Valid title",
          type: "QUESTION",
          content: "Valid content here",
          tagIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        };

        expect(() => NewPostRequestSchema.parse(invalidPost)).toThrow(ZodError);
      });

      it("should reject negative tag IDs", () => {
        const invalidPost = {
          title: "Valid title",
          type: "QUESTION",
          content: "Valid content here",
          tagIds: [1, -2, 3],
        };

        expect(() => NewPostRequestSchema.parse(invalidPost)).toThrow(ZodError);
      });

      it("should reject zero tag IDs", () => {
        const invalidPost = {
          title: "Valid title",
          type: "QUESTION",
          content: "Valid content here",
          tagIds: [1, 0, 3],
        };

        expect(() => NewPostRequestSchema.parse(invalidPost)).toThrow(ZodError);
      });
    });

    describe("Resource Posts", () => {
      it("should validate valid RESOURCE post request", () => {
        const validResource = {
          title: "JavaScript Cheat Sheet",
          type: "RESOURCE",
          tagIds: [4, 5],
        };

        const result = NewPostRequestSchema.parse(validResource);
        expect(result).toEqual(validResource);
      });

      it("should reject RESOURCE post with content field", () => {
        const invalidResource = {
          title: "JavaScript Guide",
          type: "RESOURCE",
          content: "This should not be here",
        };

        expect(() => NewPostRequestSchema.parse(invalidResource)).toThrow(
          ZodError
        );
      });
    });
  });

  describe("CompletePostSchema", () => {
    it("should validate complete text post", () => {
      const completeTextPost = {
        title: "How to learn TypeScript?",
        type: "QUESTION",
        content: "I want to learn TypeScript but don't know where to start...",
        tagIds: [1, 2],
      };

      const result = CompletePostSchema.parse(completeTextPost);
      expect(result).toEqual(completeTextPost);
    });

    it("should validate complete resource post", () => {
      const completeResourcePost = {
        title: "React Documentation",
        type: "RESOURCE",
        fileUrl: "https://example.com/file.pdf",
        fileName: "react-docs.pdf",
        fileSize: 1024000,
        mimeType: "application/pdf",
        tagIds: [3, 4],
      };

      const result = CompletePostSchema.parse(completeResourcePost);
      expect(result).toEqual(completeResourcePost);
    });

    it("should reject resource post without required file fields", () => {
      const incompleteResource = {
        title: "Some Resource",
        type: "RESOURCE",
        tagIds: [1],
      };

      expect(() => CompletePostSchema.parse(incompleteResource)).toThrow(
        ZodError
      );
    });

    it("should reject resource post with negative file size", () => {
      const invalidResource = {
        title: "Bad Resource",
        type: "RESOURCE",
        fileUrl: "https://example.com/file.pdf",
        fileName: "file.pdf",
        fileSize: -100,
        mimeType: "application/pdf",
      };

      expect(() => CompletePostSchema.parse(invalidResource)).toThrow(ZodError);
    });
  });

  describe("PostIdParamSchema", () => {
    it("should validate valid UUID", () => {
      const validParam = {
        id: "123e4567-e89b-12d3-a456-426614174000",
      };

      const result = PostIdParamSchema.parse(validParam);
      expect(result).toEqual(validParam);
    });

    it("should reject invalid UUID format", () => {
      const invalidParam = {
        id: "not-a-valid-uuid",
      };

      expect(() => PostIdParamSchema.parse(invalidParam)).toThrow(ZodError);

      try {
        PostIdParamSchema.parse(invalidParam);
      } catch (error) {
        expect((error as ZodError).issues[0].message).toBe(
          "Invalid post ID format in URL parameter."
        );
      }
    });

    it("should reject numeric ID", () => {
      const invalidParam = {
        id: "12345",
      };

      expect(() => PostIdParamSchema.parse(invalidParam)).toThrow(ZodError);
    });

    it("should reject empty string", () => {
      const invalidParam = {
        id: "",
      };

      expect(() => PostIdParamSchema.parse(invalidParam)).toThrow(ZodError);
    });
  });

  describe("UpdatedPostSchema", () => {
    it("should validate updated text post", () => {
      const updatedTextPost = {
        title: "Updated Question Title",
        type: "QUESTION",
        content: "This is the updated content for my question...",
        tagIds: [1, 2, 3],
      };

      const result = UpdatedPostSchema.parse(updatedTextPost);
      expect(result).toEqual(updatedTextPost);
    });

    it("should validate updated resource post", () => {
      const updatedResourcePost = {
        title: "Updated Resource Title",
        type: "RESOURCE",
        fileName: "updated-filename.pdf",
        tagIds: [4, 5],
      };

      const result = UpdatedPostSchema.parse(updatedResourcePost);
      expect(result).toEqual(updatedResourcePost);
    });

    it("should reject resource update without fileName", () => {
      const invalidUpdate = {
        title: "Updated Resource",
        type: "RESOURCE",
        tagIds: [1],
      };

      expect(() => UpdatedPostSchema.parse(invalidUpdate)).toThrow(ZodError);
    });

    it("should reject resource update with empty fileName", () => {
      const invalidUpdate = {
        title: "Updated Resource",
        type: "RESOURCE",
        fileName: "",
        tagIds: [1],
      };

      expect(() => UpdatedPostSchema.parse(invalidUpdate)).toThrow(ZodError);
    });

    it("should trim whitespace from fileName", () => {
      const updateWithWhitespace = {
        title: "Updated Resource",
        type: "RESOURCE",
        fileName: "  trimmed-filename.pdf  ",
      };

      const result = UpdatedPostSchema.parse(
        updateWithWhitespace
      ) as ResourcePostInput;
      expect(result.fileName).toBe("trimmed-filename.pdf");
    });
  });

  describe("Discriminated Union Testing", () => {
    describe("NewPostRequestSchema Discrimination", () => {
      it("should correctly discriminate between text and resource posts", () => {
        // Text post should require content
        const textPost = {
          title: "Valid Question Title",
          type: "QUESTION",
          content: "This is valid content for a question post...",
        };

        const resourcePost = {
          title: "Valid Resource Title",
          type: "RESOURCE",
          tagIds: [1, 2],
        };

        expect(() => NewPostRequestSchema.parse(textPost)).not.toThrow();
        expect(() => NewPostRequestSchema.parse(resourcePost)).not.toThrow();
      });

      it("should reject text post without content", () => {
        const invalidTextPost = {
          title: "Question without content",
          type: "QUESTION",
          // Missing content field
        };

        expect(() => NewPostRequestSchema.parse(invalidTextPost)).toThrow(
          ZodError
        );
      });

      it("should reject resource post with content field", () => {
        const invalidResourcePost = {
          title: "Resource with content",
          type: "RESOURCE",
          content: "Resources should not have content",
        };

        expect(() => NewPostRequestSchema.parse(invalidResourcePost)).toThrow(
          ZodError
        );
      });

      it("should reject invalid post type", () => {
        const invalidPost = {
          title: "Valid title",
          type: "INVALID_TYPE",
          content: "Some content",
        };

        const result = NewPostRequestSchema.safeParse(invalidPost);

        expect(result.success).toBe(false);

        if (!result.success) {
          expect(result.error.issues).toHaveLength(1);
          expect(result.error.issues[0].path).toEqual(["type"]);
          expect(result.error.issues[0].message).toContain("Invalid input");
        }
      });
    });

    describe("CompletePostSchema Discrimination", () => {
      it("should correctly handle text posts in complete schema", () => {
        const completeTextPost = {
          title: "Complete Question",
          type: "NOTE",
          content: "This is a complete note with all required fields...",
          tagIds: [1, 2, 3],
        };

        const result = CompletePostSchema.parse(
          completeTextPost
        ) as TextPostInput;
        expect(result.type).toBe("NOTE");
        expect(result.content).toBeDefined();
        expect("fileUrl" in result).toBe(false);
      });

      it("should correctly handle resource posts in complete schema", () => {
        const completeResourcePost = {
          title: "Complete Resource",
          type: "RESOURCE",
          fileUrl: "https://example.com/document.pdf",
          fileName: "document.pdf",
          fileSize: 2048,
          mimeType: "application/pdf",
          tagIds: [4, 5],
        };

        const result = CompletePostSchema.parse(
          completeResourcePost
        ) as ResourcePostInput;
        expect(result.type).toBe("RESOURCE");
        expect(result.fileUrl).toBeDefined();
        expect("content" in result).toBe(false);
      });

      it("should reject incomplete resource in complete schema", () => {
        const incompleteResource = {
          title: "Incomplete Resource",
          type: "RESOURCE",
          fileUrl: "https://example.com/file.pdf",
          // Missing fileName, fileSize, mimeType
        };

        expect(() => CompletePostSchema.parse(incompleteResource)).toThrow(
          ZodError
        );
      });
    });

    describe("UpdatedPostSchema Discrimination", () => {
      it("should handle text post updates correctly", () => {
        const textUpdate = {
          title: "Updated Question Title",
          type: "QUESTION",
          content: "This is the updated content for the question...",
          tagIds: [1, 2],
        };

        const result = UpdatedPostSchema.parse(textUpdate) as TextPostInput;
        expect(result.type).toBe("QUESTION");
        expect(result.content).toBeDefined();
        expect("fileName" in result).toBe(false);
      });

      it("should handle resource post updates correctly", () => {
        const resourceUpdate = {
          title: "Updated Resource Title",
          type: "RESOURCE",
          fileName: "updated-document.pdf",
          tagIds: [3, 4],
        };

        const result = UpdatedPostSchema.parse(
          resourceUpdate
        ) as ResourcePostInput;
        expect(result.type).toBe("RESOURCE");
        expect(result.fileName).toBeDefined();
        expect("content" in result).toBe(false);
      });

      it("should reject resource update without fileName", () => {
        const invalidResourceUpdate = {
          title: "Resource Update",
          type: "RESOURCE",
          tagIds: [1],
          // Missing required fileName
        };

        expect(() => UpdatedPostSchema.parse(invalidResourceUpdate)).toThrow(
          ZodError
        );
      });
    });

    describe("Cross-Schema Type Consistency", () => {
      it("should maintain type consistency across schemas", () => {
        // Same base data
        const baseData = {
          title: "Consistent Post Title",
          tagIds: [1, 2, 3],
        };

        // Text post variants
        const newTextPost = {
          ...baseData,
          type: "QUESTION",
          content: "This is question content that meets requirements...",
        };

        const completeTextPost = { ...newTextPost };
        const updatedTextPost = { ...newTextPost };

        expect(() => NewPostRequestSchema.parse(newTextPost)).not.toThrow();
        expect(() => CompletePostSchema.parse(completeTextPost)).not.toThrow();
        expect(() => UpdatedPostSchema.parse(updatedTextPost)).not.toThrow();

        // Resource post variants
        const newResourcePost = {
          ...baseData,
          type: "RESOURCE",
        };

        const completeResourcePost = {
          ...baseData,
          type: "RESOURCE",
          fileUrl: "https://example.com/file.pdf",
          fileName: "file.pdf",
          fileSize: 1024,
          mimeType: "application/pdf",
        };

        const updatedResourcePost = {
          ...baseData,
          type: "RESOURCE",
          fileName: "updated-file.pdf",
        };

        expect(() => NewPostRequestSchema.parse(newResourcePost)).not.toThrow();
        expect(() =>
          CompletePostSchema.parse(completeResourcePost)
        ).not.toThrow();
        expect(() =>
          UpdatedPostSchema.parse(updatedResourcePost)
        ).not.toThrow();
      });
    });
  });

  describe("Edge Cases and Error Messages", () => {
    it("should provide detailed error information for discriminated unions", () => {
      const invalidPost = {
        title: "Hi", // Too short
        type: "INVALID", // Invalid discriminator
        content: "Short", // Too short
        tagIds: [-1, 0, 1], // Invalid IDs
      };

      try {
        NewPostRequestSchema.parse(invalidPost);
      } catch (error) {
        const zodError = error as ZodError;
        expect(zodError.issues[0].message).toContain("Invalid input");
        expect(zodError.issues[0].path).toEqual(["type"]);
      }
    });

    it("should handle missing required fields", () => {
      const incompletePost = {
        title: "Valid title",
        // Missing type and content
      };

      expect(() => NewPostRequestSchema.parse(incompletePost)).toThrow(
        ZodError
      );
    });

    it("should handle null and undefined values", () => {
      const postWithNulls = {
        title: null,
        type: "QUESTION",
        content: undefined,
      };

      expect(() => NewPostRequestSchema.parse(postWithNulls)).toThrow(ZodError);
    });

    it("should handle non-string values for string fields", () => {
      const postWithNumbers = {
        title: 12345,
        type: "QUESTION",
        content: 67890,
      };

      expect(() => NewPostRequestSchema.parse(postWithNumbers)).toThrow(
        ZodError
      );
    });
  });

  describe("Schema Integration", () => {
    it("should work with safeParse for error handling", () => {
      const invalidPost = {
        title: "Hi",
        type: "QUESTION",
        content: "Short",
      };

      const result = NewPostRequestSchema.safeParse(invalidPost);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ZodError);
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });

    it("should work with parse for throwing behavior", () => {
      const validPost = {
        title: "Valid Question Title",
        type: "QUESTION",
        content: "This is a valid question with enough content...",
      };

      expect(() => {
        const result = NewPostRequestSchema.parse(validPost);
        expect(result.title).toBe(validPost.title);
      }).not.toThrow();
    });
  });
});
