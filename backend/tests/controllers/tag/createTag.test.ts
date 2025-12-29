import { Request, Response } from "express";
import { ZodError } from "zod";

import { createTag } from "../../../src/controllers/tag.controller";
import prisma from "../../../src/core/config/db";
import { handleError } from "../../../src/core/error";
import { AuthorizationError } from "../../../src/core/error/custom/auth.error";

import { createAuthenticatedUser } from "./shared/helpers";
import { createMockRequest, createMockResponse } from "./shared/mocks";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../src/core/config/logger.js", () => ({
  createLogger: vi.fn(() => ({
    child: vi.fn(() => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    })),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
  logger: {
    child: vi.fn(() => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    })),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../../../src/core/config/db.js", () => ({
  default: {
    tag: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock("../../../src/core/error/index.js");

describe("createTag controller", () => {
  let mockRequest: Request;
  let mockResponse: Response;

  const mockUserId = "c3d4e5f6-7890-1234-5678-90abcdef1234";

  beforeEach(() => {
    vi.clearAllMocks();

    mockRequest = createMockRequest();
    mockResponse = createMockResponse();
  });

  describe("Authorization Tests", () => {
    it("should call handleError for non-admin user", async () => {
      mockRequest.body = { name: "JavaScript" };
      mockRequest.user = createAuthenticatedUser({
        id: mockUserId,
        role: "STUDENT",
      });

      await createTag(mockRequest, mockResponse);

      expect(prisma.tag.create).not.toHaveBeenCalled();
      expect(handleError).toHaveBeenCalledWith(
        expect.any(AuthorizationError),
        mockResponse
      );
    });

    it("should call handleError for unauthenticated user", async () => {
      mockRequest.body = { name: "JavaScript" };
      mockRequest.user = undefined;

      await createTag(mockRequest, mockResponse);

      expect(prisma.tag.create).not.toHaveBeenCalled();
      expect(handleError).toHaveBeenCalledWith(
        expect.any(AuthorizationError),
        mockResponse
      );
    });

    it("should call handleError for TEACHER role", async () => {
      mockRequest.body = { name: "JavaScript" };
      mockRequest.user = createAuthenticatedUser({
        id: mockUserId,
        role: "TEACHER",
      });

      await createTag(mockRequest, mockResponse);

      expect(prisma.tag.create).not.toHaveBeenCalled();
      expect(handleError).toHaveBeenCalledWith(
        expect.any(AuthorizationError),
        mockResponse
      );
    });

    it("should allow ADMIN role to create tags", async () => {
      mockRequest.body = { name: "JavaScript" };
      mockRequest.user = createAuthenticatedUser({
        id: mockUserId,
        role: "ADMIN",
      });

      vi.mocked(prisma.tag.create).mockResolvedValue({
        id: 1,
        name: "javascript",
      });

      await createTag(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });
  });

  describe("Request Body Validation Tests", () => {
    beforeEach(() => {
      mockRequest.user = createAuthenticatedUser({
        id: mockUserId,
        role: "ADMIN",
      });
    });

    it("should handle missing name field", async () => {
      mockRequest.body = {};

      await createTag(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalled();
      expect(prisma.tag.create).not.toHaveBeenCalled();
    });

    it("should handle invalid field in request body", async () => {
      mockRequest.body = { invalidField: "test" };

      await createTag(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalled();
      expect(prisma.tag.create).not.toHaveBeenCalled();
    });

    it("should handle name with wrong type (number)", async () => {
      mockRequest.body = { name: 123 };

      await createTag(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalled();
      expect(prisma.tag.create).not.toHaveBeenCalled();
    });

    it("should handle name with wrong type (boolean)", async () => {
      mockRequest.body = { name: true };

      await createTag(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalled();
      expect(prisma.tag.create).not.toHaveBeenCalled();
    });

    it("should handle name with wrong type (object)", async () => {
      mockRequest.body = { name: { value: "test" } };

      await createTag(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalled();
      expect(prisma.tag.create).not.toHaveBeenCalled();
    });

    it("should handle name with wrong type (array)", async () => {
      mockRequest.body = { name: ["javascript"] };

      await createTag(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalled();
      expect(prisma.tag.create).not.toHaveBeenCalled();
    });

    it("should handle name with wrong type (null)", async () => {
      mockRequest.body = { name: null };

      await createTag(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalled();
      expect(prisma.tag.create).not.toHaveBeenCalled();
    });

    it("should handle empty string name", async () => {
      mockRequest.body = { name: "" };

      await createTag(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalled();
      expect(prisma.tag.create).not.toHaveBeenCalled();
    });

    it("should handle whitespace-only name", async () => {
      mockRequest.body = { name: "   " };

      await createTag(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalled();
      expect(prisma.tag.create).not.toHaveBeenCalled();
    });

    it("should handle name with only tabs and newlines", async () => {
      mockRequest.body = { name: "\t\n\r" };

      await createTag(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalled();
      expect(prisma.tag.create).not.toHaveBeenCalled();
    });

    it("should handle multiple fields including name", async () => {
      mockRequest.body = { name: "JavaScript", extraField: "test" };

      await createTag(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalled();
      expect(prisma.tag.create).not.toHaveBeenCalled();
    });
  });

  describe("Tag Name Normalization Tests", () => {
    beforeEach(() => {
      mockRequest.user = createAuthenticatedUser({
        id: mockUserId,
        role: "ADMIN",
      });
    });

    it("should normalize tag name to lowercase", async () => {
      mockRequest.body = { name: "JAVASCRIPT" };

      vi.mocked(prisma.tag.create).mockResolvedValue({
        id: 1,
        name: "javascript",
      });

      await createTag(mockRequest, mockResponse);

      expect(prisma.tag.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { name: "javascript" },
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });

    it("should trim leading whitespace from tag name", async () => {
      mockRequest.body = { name: "  JavaScript" };

      vi.mocked(prisma.tag.create).mockResolvedValue({
        id: 1,
        name: "javascript",
      });

      await createTag(mockRequest, mockResponse);

      expect(prisma.tag.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { name: "javascript" },
        })
      );
    });

    it("should trim trailing whitespace from tag name", async () => {
      mockRequest.body = { name: "JavaScript  " };

      vi.mocked(prisma.tag.create).mockResolvedValue({
        id: 1,
        name: "javascript",
      });

      await createTag(mockRequest, mockResponse);

      expect(prisma.tag.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { name: "javascript" },
        })
      );
    });

    it("should trim both leading and trailing whitespace", async () => {
      mockRequest.body = { name: "  JavaScript  " };

      vi.mocked(prisma.tag.create).mockResolvedValue({
        id: 1,
        name: "javascript",
      });

      await createTag(mockRequest, mockResponse);

      expect(prisma.tag.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { name: "javascript" },
        })
      );
    });

    it("should normalize mixed case tag name", async () => {
      mockRequest.body = { name: "JaVaScRiPt" };

      vi.mocked(prisma.tag.create).mockResolvedValue({
        id: 1,
        name: "javascript",
      });

      await createTag(mockRequest, mockResponse);

      expect(prisma.tag.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { name: "javascript" },
        })
      );
    });

    it("should handle tag name with internal spaces", async () => {
      mockRequest.body = { name: "React Native" };

      vi.mocked(prisma.tag.create).mockResolvedValue({
        id: 1,
        name: "react native",
      });

      await createTag(mockRequest, mockResponse);

      expect(prisma.tag.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { name: "react native" },
        })
      );
    });

    it("should normalize multiple internal spaces to single space", async () => {
      mockRequest.body = { name: "JavaScript    React" };

      vi.mocked(prisma.tag.create).mockResolvedValue({
        id: 1,
        name: "javascript react",
      });

      await createTag(mockRequest, mockResponse);

      expect(prisma.tag.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { name: "javascript react" },
        })
      );
    });

    it("should handle mixed case with multiple spaces and trim", async () => {
      mockRequest.body = { name: "  JaVaScRiPt  ReAcT  " };

      vi.mocked(prisma.tag.create).mockResolvedValue({
        id: 1,
        name: "javascript react",
      });

      await createTag(mockRequest, mockResponse);

      expect(prisma.tag.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { name: "javascript react" },
        })
      );
    });

    it("should handle numbers in tag name", async () => {
      mockRequest.body = { name: "Vue3" };

      vi.mocked(prisma.tag.create).mockResolvedValue({
        id: 1,
        name: "vue3",
      });

      await createTag(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalledWith(
        expect.any(ZodError),
        mockResponse
      );
    });

    it("should handle unicode characters in tag name", async () => {
      mockRequest.body = { name: "日本語" };

      vi.mocked(prisma.tag.create).mockResolvedValue({
        id: 1,
        name: "日本語",
      });

      await createTag(mockRequest, mockResponse);

      expect(prisma.tag.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { name: "日本語" },
        })
      );
    });

    it("should handle emojis in tag name", async () => {
      mockRequest.body = { name: "React⚛️" };

      vi.mocked(prisma.tag.create).mockResolvedValue({
        id: 1,
        name: "react⚛️",
      });

      await createTag(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalledWith(
        expect.any(ZodError),
        mockResponse
      );
    });
  });

  describe("Successful Creation Tests", () => {
    beforeEach(() => {
      mockRequest.user = createAuthenticatedUser({
        id: mockUserId,
        role: "ADMIN",
      });
    });

    it("should create a new tag successfully", async () => {
      mockRequest.body = { name: "JavaScript" };

      const mockTag = {
        id: 1,
        name: "javascript",
      };

      vi.mocked(prisma.tag.create).mockResolvedValue(mockTag);

      await createTag(mockRequest, mockResponse);

      expect(prisma.tag.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { name: "javascript" },
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "New tag created successfully",
        data: mockTag,
      });
    });

    it("should return correct response structure on success", async () => {
      mockRequest.body = { name: "TypeScript" };

      const mockTag = { id: 5, name: "typescript" };
      vi.mocked(prisma.tag.create).mockResolvedValue(mockTag);

      await createTag(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "New tag created successfully",
        data: mockTag,
      });
    });

    it("should create tag with generated ID from database", async () => {
      mockRequest.body = { name: "React" };

      const mockTag = { id: 999, name: "react" };
      vi.mocked(prisma.tag.create).mockResolvedValue(mockTag);

      await createTag(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "New tag created successfully",
        data: mockTag,
      });
    });

    it("should create multiple different tags sequentially", async () => {
      const tags = ["JavaScript", "TypeScript", "Python"];

      for (let i = 0; i < tags.length; i++) {
        vi.clearAllMocks();
        mockRequest.body = { name: tags[i] };

        vi.mocked(prisma.tag.create).mockResolvedValue({
          id: i + 1,
          name: tags[i].toLowerCase(),
        });

        await createTag(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(201);
      }
    });
  });

  describe("Database Error Handling Tests", () => {
    beforeEach(() => {
      mockRequest.user = createAuthenticatedUser({
        id: mockUserId,
        role: "ADMIN",
      });
      mockRequest.body = { name: "JavaScript" };
    });

    it("should handle general database error", async () => {
      const mockError = new Error("Database connection failed");

      vi.mocked(prisma.tag.create).mockRejectedValue(mockError);

      await createTag(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalledWith(mockError, mockResponse);
    });
  });

  describe("Edge Cases", () => {
    beforeEach(() => {
      mockRequest.user = createAuthenticatedUser({
        id: mockUserId,
        role: "ADMIN",
      });
    });

    it("should handle very long tag name", async () => {
      mockRequest.body = { name: "a".repeat(1000) };

      await createTag(mockRequest, mockResponse);

      // Should be handled by schema validation
      expect(handleError).toHaveBeenCalled();
    });

    it("should handle single character tag name", async () => {
      mockRequest.body = { name: "A" };

      vi.mocked(prisma.tag.create).mockResolvedValue({
        id: 1,
        name: "a",
      });

      await createTag(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalledWith(
        expect.any(ZodError),
        mockResponse
      );
    });

    it("should handle tag name with only special characters", async () => {
      mockRequest.body = { name: "+++" };

      vi.mocked(prisma.tag.create).mockResolvedValue({
        id: 1,
        name: "+++",
      });

      await createTag(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalledWith(
        expect.any(ZodError),
        mockResponse
      );
    });

    it("should handle tag name with mixed unicode and ascii", async () => {
      mockRequest.body = { name: "React日本語" };

      vi.mocked(prisma.tag.create).mockResolvedValue({
        id: 1,
        name: "react日本語",
      });

      await createTag(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });

    it("should handle tag name with leading/trailing special characters", async () => {
      mockRequest.body = { name: "-JavaScript-" };

      vi.mocked(prisma.tag.create).mockResolvedValue({
        id: 1,
        name: "-javascript-",
      });

      await createTag(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalledWith(
        expect.any(ZodError),
        mockResponse
      );
    });

    it("should handle tag name that looks like SQL injection", async () => {
      mockRequest.body = { name: "'; DROP TABLE tags; --" };

      vi.mocked(prisma.tag.create).mockResolvedValue({
        id: 1,
        name: "'; drop table tags; --",
      });

      await createTag(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalledWith(
        expect.any(ZodError),
        mockResponse
      );
    });

    it("should handle tag name with escaped characters", async () => {
      mockRequest.body = { name: 'JavaScript\\"React' };

      vi.mocked(prisma.tag.create).mockResolvedValue({
        id: 1,
        name: 'javascript\\"react',
      });

      await createTag(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalledWith(
        expect.any(ZodError),
        mockResponse
      );
    });
  });
});
