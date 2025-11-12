import { getReportReasons } from "../../../controllers/report.controller";
import prisma from "../../../core/config/db.js";
import { handleError } from "../../../core/error";

import { createMockRequest, createMockResponse } from "./shared/mocks";

import type { Request, Response } from "express";

// 1. Mock the Logger globally
vi.mock("../../../core/config/logger.js", () => ({
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

// 2. Mock the Error Handler globally
vi.mock("../../../core/error/index", () => ({
  handleError: vi.fn(),
}));

// 3. Mock the Database (Prisma) dependency globally
vi.mock("../../../core/config/db.js", () => ({
  default: {
    reportReason: {
      findMany: vi.fn(),
    },
  },
}));

describe("getReportReasons controller", () => {
  let mockRequest: Request;
  let mockResponse: Response;

  // --- Mock Data Factories ---
  const createMockReportReason = (overrides = {}) => ({
    id: 1,
    label: "Spam",
    description: "Unwanted or repetitive content",
    active: true,
    ...overrides,
  });

  const mockReportReasons = [
    createMockReportReason({
      id: 1,
      label: "Spam",
      description: "Unwanted or repetitive content",
    }),
    createMockReportReason({
      id: 2,
      label: "Harassment",
      description: "Bullying or targeted harassment",
    }),
    createMockReportReason({
      id: 3,
      label: "Inappropriate Content",
      description: "Content that violates community guidelines",
    }),
    createMockReportReason({
      id: 4,
      label: "Misinformation",
      description: "False or misleading information",
    }),
  ];

  // --- Setup/Teardown Hooks (Crucial for isolation) ---
  beforeEach(() => {
    mockRequest = createMockRequest();
    mockResponse = createMockResponse();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("Success Cases", () => {
    it("should fetch and return all active report reasons successfully", async () => {
      vi.mocked(prisma.reportReason.findMany).mockResolvedValue(
        mockReportReasons
      );

      await getReportReasons(mockRequest, mockResponse);

      // Verify the correct Prisma query was executed
      expect(prisma.reportReason.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { active: true },
          select: expect.objectContaining({
            id: true,
          }),
        })
      );
      // Verify successful HTTP response
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: mockReportReasons,
      });
      // Verify error handler was not called
      expect(handleError).not.toHaveBeenCalled();
    });

    it("should return empty array when no active report reasons exist", async () => {
      vi.mocked(prisma.reportReason.findMany).mockResolvedValue([]);

      await getReportReasons(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: [],
      });
      expect(handleError).not.toHaveBeenCalled();
    });

    it("should return single report reason when only one exists", async () => {
      const singleReason = [createMockReportReason()];

      vi.mocked(prisma.reportReason.findMany).mockResolvedValue(singleReason);

      await getReportReasons(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: singleReason,
      });
    });

    it("should handle report reasons with null descriptions", async () => {
      const reasonsWithNullDesc = [
        createMockReportReason({
          id: 1,
          label: "Spam",
          description: null, // Test case for null value
        }),
        createMockReportReason({
          id: 2,
          label: "Other",
          description: null,
        }),
      ];

      vi.mocked(prisma.reportReason.findMany).mockResolvedValue(
        reasonsWithNullDesc
      );

      await getReportReasons(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: reasonsWithNullDesc,
      });
    });

    it("should return reasons ordered by id in ascending order", async () => {
      const unorderedReasons = [
        createMockReportReason({ id: 5, label: "Fifth" }),
        createMockReportReason({ id: 1, label: "First" }),
        createMockReportReason({ id: 3, label: "Third" }),
      ];

      vi.mocked(prisma.reportReason.findMany).mockResolvedValue(
        unorderedReasons
      );

      await getReportReasons(mockRequest, mockResponse);

      // Assertion that the database call included the correct orderBy parameter
      expect(prisma.reportReason.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { id: "asc" },
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe("Error Cases", () => {
    it("should call handleError when database query fails", async () => {
      const dbError = new Error("Database connection failed");

      // Mock the promise to be rejected
      vi.mocked(prisma.reportReason.findMany).mockRejectedValue(dbError);

      await getReportReasons(mockRequest, mockResponse);

      // Verify handleError is called with the error and response object
      expect(handleError).toHaveBeenCalledWith(dbError, mockResponse);
      // Verify no successful response methods were called
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it("should call handleError when unexpected error occurs", async () => {
      const unexpectedError = new Error("Unexpected error");

      vi.mocked(prisma.reportReason.findMany).mockRejectedValue(
        unexpectedError
      );

      await getReportReasons(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalledWith(unexpectedError, mockResponse);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should call handleError when database throws timeout error", async () => {
      const timeoutError = new Error("Query timeout exceeded");

      vi.mocked(prisma.reportReason.findMany).mockRejectedValue(timeoutError);

      await getReportReasons(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalledWith(timeoutError, mockResponse);
    });

    it("should call handleError when Prisma throws validation error", async () => {
      const validationError = new Error("Invalid query parameters");

      vi.mocked(prisma.reportReason.findMany).mockRejectedValue(
        validationError
      );

      await getReportReasons(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalledWith(validationError, mockResponse);
    });
  });

  describe("Response Format Validation", () => {
    it("should return correct response structure with data property", async () => {
      vi.mocked(prisma.reportReason.findMany).mockResolvedValue(
        mockReportReasons
      );

      await getReportReasons(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: expect.any(Array),
      });
    });

    it("should return array of report reasons with correct structure", async () => {
      vi.mocked(prisma.reportReason.findMany).mockResolvedValue(
        mockReportReasons
      );

      await getReportReasons(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(Number),
            label: expect.any(String),
            description: expect.anything(), // Can be string or null
            active: expect.any(Boolean),
          }),
        ]),
      });
    });

    it("should return reasons with all required fields", async () => {
      vi.mocked(prisma.reportReason.findMany).mockResolvedValue([
        createMockReportReason({
          id: 1,
          label: "Test Reason",
          description: "Test Description",
          active: true,
        }),
      ]);

      await getReportReasons(mockRequest, mockResponse);

      const callArgs = vi.mocked(mockResponse.json).mock.calls[0][0];
      expect(callArgs.data[0]).toHaveProperty("id");
      expect(callArgs.data[0]).toHaveProperty("label");
      expect(callArgs.data[0]).toHaveProperty("description");
      expect(callArgs.data[0]).toHaveProperty("active");
    });
  });

  describe("Edge Cases", () => {
    it("should handle very long reason descriptions", async () => {
      const longDescription = "a".repeat(1000);
      const reasonWithLongDesc = [
        createMockReportReason({
          description: longDescription,
        }),
      ];

      vi.mocked(prisma.reportReason.findMany).mockResolvedValue(
        reasonWithLongDesc
      );

      await getReportReasons(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: reasonWithLongDesc,
      });
    });

    it("should handle special characters in reason labels", async () => {
      const specialCharsReasons = [
        createMockReportReason({
          label: "Spam & Scams",
          description: "Content with <special> characters & symbols",
        }),
        createMockReportReason({
          label: "Harassment/Bullying",
          description: "Targeted harassment @ users",
        }),
      ];

      vi.mocked(prisma.reportReason.findMany).mockResolvedValue(
        specialCharsReasons
      );

      await getReportReasons(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: specialCharsReasons,
      });
    });

    it("should handle unicode characters in reason labels", async () => {
      const unicodeReasons = [
        createMockReportReason({
          label: "Spam 垃圾邮件",
          description: "Contenido inapropiado 🚫",
        }),
      ];

      vi.mocked(prisma.reportReason.findMany).mockResolvedValue(unicodeReasons);

      await getReportReasons(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: unicodeReasons,
      });
    });

    it("should handle large number of report reasons", async () => {
      const manyReasons = Array.from({ length: 100 }, (_, i) =>
        createMockReportReason({
          id: i + 1,
          label: `Reason ${i + 1}`,
          description: `Description for reason ${i + 1}`,
        })
      );

      vi.mocked(prisma.reportReason.findMany).mockResolvedValue(manyReasons);

      await getReportReasons(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      const callArgs = vi.mocked(mockResponse.json).mock.calls[0][0];
      expect(callArgs.data).toHaveLength(100);
    });

    it("should handle empty string descriptions", async () => {
      const emptyDescReasons = [
        createMockReportReason({
          label: "Other",
          description: "",
        }),
      ];

      vi.mocked(prisma.reportReason.findMany).mockResolvedValue(
        emptyDescReasons
      );

      await getReportReasons(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: emptyDescReasons,
      });
    });

    it("should only return active report reasons", async () => {
      vi.mocked(prisma.reportReason.findMany).mockResolvedValue(
        mockReportReasons
      );

      await getReportReasons(mockRequest, mockResponse);

      // Verify the `where: { active: true }` filter is applied
      expect(prisma.reportReason.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { active: true },
        })
      );
    });
  });

  describe("Database Integration", () => {
    it("should call repository with correct fixed query parameters", async () => {
      vi.mocked(prisma.reportReason.findMany).mockResolvedValue([]);

      await getReportReasons(mockRequest, mockResponse);

      expect(prisma.reportReason.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { active: true },
          select: expect.objectContaining({
            id: true,
          }),
        })
      );
      expect(prisma.reportReason.findMany).toHaveBeenCalledTimes(1);
    });

    it("should ignore extraneous request parameters (query, params) and call repository with fixed params", async () => {
      // Set extraneous parameters on the mock request
      mockRequest.query = { someParam: "value" };
      mockRequest.params = { id: "123" };

      vi.mocked(prisma.reportReason.findMany).mockResolvedValue([]);

      await getReportReasons(mockRequest, mockResponse);

      // Should always call with same fixed parameters regardless of request
      expect(prisma.reportReason.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { active: true },
          select: expect.objectContaining({
            id: true,
          }),
        })
      );
    });
  });
});
