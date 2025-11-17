import { getReportStats } from "../../../controllers/report.controller";
import prisma from "../../../core/config/db.js";
import { AuthorizationError } from "../../../core/error/custom/auth.error";
import { handleError } from "../../../core/error/index.js";

import { createAuthenticatedUser } from "./shared/helpers";
import { createMockRequest, createMockResponse } from "./shared/mocks";

import type { Role } from "@prisma/client";
import type { Request, Response } from "express";

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

vi.mock("../../../core/error/index.js", () => ({
  handleError: vi.fn(),
}));

vi.mock("../../../core/config/db.js", () => ({
  default: {
    report: {
      count: vi.fn(),
    },
    post: {
      count: vi.fn(),
    },
    comment: {
      count: vi.fn(),
    },
  },
}));

describe("getReportStats controller", () => {
  let mockRequest: Request;
  let mockResponse: Response;
  const mockAdminUser = createAuthenticatedUser({ role: "ADMIN" });

  beforeEach(() => {
    mockRequest = createMockRequest();
    mockResponse = createMockResponse();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("Success Cases", () => {
    it("should fetch report statistics successfully with all counts", async () => {
      mockRequest.user = mockAdminUser;

      // Mock all count queries
      vi.mocked(prisma.report.count)
        .mockResolvedValueOnce(150) // totalReports
        .mockResolvedValueOnce(85) // pending
        .mockResolvedValueOnce(50) // reviewed
        .mockResolvedValueOnce(15); // dismissed

      vi.mocked(prisma.post.count).mockResolvedValue(5); // hidden posts
      vi.mocked(prisma.comment.count).mockResolvedValue(8); // hidden comments

      await getReportStats(mockRequest, mockResponse);

      // Verify all count queries were called
      expect(prisma.report.count).toHaveBeenCalledTimes(4);
      expect(prisma.report.count).toHaveBeenNthCalledWith(1); // total
      expect(prisma.report.count).toHaveBeenNthCalledWith(2, {
        where: { status: "PENDING" },
      });
      expect(prisma.report.count).toHaveBeenNthCalledWith(3, {
        where: { status: "REVIEWED" },
      });
      expect(prisma.report.count).toHaveBeenNthCalledWith(4, {
        where: { status: "DISMISSED" },
      });

      expect(prisma.post.count).toHaveBeenCalledWith({
        where: { hidden: true },
      });
      expect(prisma.comment.count).toHaveBeenCalledWith({
        where: { hidden: true },
      });

      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: {
          totalReports: 150,
          pending: 85,
          reviewed: 50,
          dismissed: 15,
          hiddenContent: 13, // 5 posts + 8 comments
        },
      });
      expect(handleError).not.toHaveBeenCalled();
    });

    it("should return zero counts when no reports or hidden content exist", async () => {
      mockRequest.user = mockAdminUser;

      // Mock all counts as zero
      vi.mocked(prisma.report.count).mockResolvedValue(0);
      vi.mocked(prisma.post.count).mockResolvedValue(0);
      vi.mocked(prisma.comment.count).mockResolvedValue(0);

      await getReportStats(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: {
          totalReports: 0,
          pending: 0,
          reviewed: 0,
          dismissed: 0,
          hiddenContent: 0,
        },
      });
    });

    it("should correctly calculate hiddenContent from posts and comments", async () => {
      mockRequest.user = mockAdminUser;

      vi.mocked(prisma.report.count).mockResolvedValue(100);
      vi.mocked(prisma.post.count).mockResolvedValue(12); // hidden posts
      vi.mocked(prisma.comment.count).mockResolvedValue(25); // hidden comments

      await getReportStats(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith({
        data: expect.objectContaining({
          hiddenContent: 37, // 12 + 25
        }),
      });
    });

    it("should handle stats with only hidden posts (no hidden comments)", async () => {
      mockRequest.user = mockAdminUser;

      vi.mocked(prisma.report.count).mockResolvedValue(50);
      vi.mocked(prisma.post.count).mockResolvedValue(10);
      vi.mocked(prisma.comment.count).mockResolvedValue(0);

      await getReportStats(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith({
        data: expect.objectContaining({
          hiddenContent: 10,
        }),
      });
    });

    it("should handle stats with only hidden comments (no hidden posts)", async () => {
      mockRequest.user = mockAdminUser;

      vi.mocked(prisma.report.count).mockResolvedValue(50);
      vi.mocked(prisma.post.count).mockResolvedValue(0);
      vi.mocked(prisma.comment.count).mockResolvedValue(7);

      await getReportStats(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith({
        data: expect.objectContaining({
          hiddenContent: 7,
        }),
      });
    });

    it("should handle large numbers of reports and hidden content", async () => {
      mockRequest.user = mockAdminUser;

      vi.mocked(prisma.report.count)
        .mockResolvedValueOnce(10000) // total
        .mockResolvedValueOnce(5000) // pending
        .mockResolvedValueOnce(3500) // reviewed
        .mockResolvedValueOnce(1500); // dismissed

      vi.mocked(prisma.post.count).mockResolvedValue(250);
      vi.mocked(prisma.comment.count).mockResolvedValue(480);

      await getReportStats(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith({
        data: {
          totalReports: 10000,
          pending: 5000,
          reviewed: 3500,
          dismissed: 1500,
          hiddenContent: 730,
        },
      });
    });
  });

  describe("Error Cases - Authorization", () => {
    it("should call handleError when user is not an admin", async () => {
      mockRequest.user = createAuthenticatedUser({
        id: "student-id",
        role: "STUDENT" as Role,
      });

      await getReportStats(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalledWith(
        expect.any(AuthorizationError),
        mockResponse
      );
      expect(prisma.report.count).not.toHaveBeenCalled();
      expect(prisma.post.count).not.toHaveBeenCalled();
      expect(prisma.comment.count).not.toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should call handleError when user is not authenticated", async () => {
      mockRequest.user = undefined;

      await getReportStats(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalledWith(expect.any(Error), mockResponse);
      expect(prisma.report.count).not.toHaveBeenCalled();
    });

    it("should call handleError when user is a teacher (not admin)", async () => {
      mockRequest.user = createAuthenticatedUser({
        id: "teacher-id",
        role: "TEACHER" as Role,
      });

      await getReportStats(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalledWith(
        expect.any(AuthorizationError),
        mockResponse
      );
      expect(prisma.report.count).not.toHaveBeenCalled();
    });
  });

  describe("Error Cases - Database", () => {
    it("should call handleError when report.count (total) fails", async () => {
      mockRequest.user = mockAdminUser;
      const dbError = new Error("Database connection failed");

      vi.mocked(prisma.report.count).mockRejectedValueOnce(dbError);

      await getReportStats(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalledWith(dbError, mockResponse);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should call handleError when report.count (pending) fails", async () => {
      mockRequest.user = mockAdminUser;
      const dbError = new Error("Query timeout");

      vi.mocked(prisma.report.count)
        .mockResolvedValueOnce(100) // total succeeds
        .mockRejectedValueOnce(dbError); // pending fails

      await getReportStats(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalledWith(dbError, mockResponse);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should call handleError when post.count fails", async () => {
      mockRequest.user = mockAdminUser;
      const dbError = new Error("Post count query failed");

      vi.mocked(prisma.report.count).mockResolvedValue(100);
      vi.mocked(prisma.post.count).mockRejectedValue(dbError);

      await getReportStats(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalledWith(dbError, mockResponse);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should call handleError when comment.count fails", async () => {
      mockRequest.user = mockAdminUser;
      const dbError = new Error("Comment count query failed");

      vi.mocked(prisma.report.count).mockResolvedValue(100);
      vi.mocked(prisma.post.count).mockResolvedValue(5);
      vi.mocked(prisma.comment.count).mockRejectedValue(dbError);

      await getReportStats(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalledWith(dbError, mockResponse);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should call handleError when all database queries fail", async () => {
      mockRequest.user = mockAdminUser;
      const dbError = new Error("Complete database failure");

      vi.mocked(prisma.report.count).mockRejectedValue(dbError);
      vi.mocked(prisma.post.count).mockRejectedValue(dbError);
      vi.mocked(prisma.comment.count).mockRejectedValue(dbError);

      await getReportStats(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalledWith(expect.any(Error), mockResponse);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should call handleError for unexpected database error types", async () => {
      mockRequest.user = mockAdminUser;
      const unexpectedError = { message: "Unexpected error format" };

      vi.mocked(prisma.report.count).mockRejectedValue(unexpectedError);

      await getReportStats(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalledWith(unexpectedError, mockResponse);
    });
  });

  describe("Edge Cases", () => {
    it("should handle when totalReports doesn't match sum of statuses", async () => {
      mockRequest.user = mockAdminUser;

      // Edge case: total is less than sum (shouldn't happen but test resilience)
      vi.mocked(prisma.report.count)
        .mockResolvedValueOnce(90) // total
        .mockResolvedValueOnce(40) // pending
        .mockResolvedValueOnce(35) // reviewed
        .mockResolvedValueOnce(20); // dismissed (sum = 95 > total)

      vi.mocked(prisma.post.count).mockResolvedValue(0);
      vi.mocked(prisma.comment.count).mockResolvedValue(0);

      await getReportStats(mockRequest, mockResponse);

      // Should still return the counts as-is
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: {
          totalReports: 90,
          pending: 40,
          reviewed: 35,
          dismissed: 20,
          hiddenContent: 0,
        },
      });
    });

    it("should handle very large hidden content numbers", async () => {
      mockRequest.user = mockAdminUser;

      vi.mocked(prisma.report.count).mockResolvedValue(1000);
      vi.mocked(prisma.post.count).mockResolvedValue(999999);
      vi.mocked(prisma.comment.count).mockResolvedValue(999999);

      await getReportStats(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith({
        data: expect.objectContaining({
          hiddenContent: 1999998, // Large number calculation
        }),
      });
    });
  });
});
