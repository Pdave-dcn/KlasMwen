import { it, expect, describe, vi, beforeEach } from "vitest";
import { ZodError } from "zod";

import { ReportNotFoundError } from "../../../src/core/error/custom/report.error.js";
import {
  getAllReports,
  getReportById,
  updateReportStatus,
  deleteReport,
  toggleVisibility,
  getReportStats,
} from "../../../src/controllers/report/report.moderator.controller.js";

const mockGetAllReports = vi.fn();
const mockGetReportById = vi.fn();
const mockUpdateReportStatus = vi.fn();
const mockDeleteReport = vi.fn();
const mockToggleVisibility = vi.fn();
const mockGetReportStats = vi.fn();

vi.mock("../../../src/features/report/service/index.js", () => ({
  reportService: {
    getAllReports: (...args: unknown[]) => mockGetAllReports(...args),
    getReportById: (...args: unknown[]) => mockGetReportById(...args),
    updateReportStatus: (...args: unknown[]) => mockUpdateReportStatus(...args),
    deleteReport: (...args: unknown[]) => mockDeleteReport(...args),
    toggleVisibility: (...args: unknown[]) => mockToggleVisibility(...args),
    getReportStats: (...args: unknown[]) => mockGetReportStats(...args),
  },
}));

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
}));

type MockReq = Record<string, unknown>;
type MockRes = {
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
};
type MockNext = ReturnType<typeof vi.fn>;

function createReq(overrides: Record<string, unknown> = {}): MockReq {
  return { params: {}, body: {}, query: {}, ...overrides };
}

function createRes(): MockRes {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
}

describe("Report Moderator Controller", () => {
  let mockRequest: MockReq;
  let mockResponse: MockRes;
  let mockNext: MockNext;

  beforeEach(() => {
    vi.clearAllMocks();
    mockResponse = createRes();
    mockNext = vi.fn();
  });

  describe("getAllReports", () => {
    it("should return paginated reports with query filters", async () => {
      mockRequest = createReq({
        query: { status: "PENDING", page: "1", limit: "10" },
      });
      const result = {
        data: [{ id: 1, status: "PENDING" }],
        pagination: { total: 1, page: 1, limit: 10, totalPages: 1, hasNext: false, hasPrevious: false },
      };
      mockGetAllReports.mockResolvedValue(result);

      await getAllReports(mockRequest as any, mockResponse as any, mockNext);

      expect(mockGetAllReports).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(result);
    });

    it("should use defaults when no query params provided", async () => {
      mockRequest = createReq({ query: {} });
      mockGetAllReports.mockResolvedValue({
        data: [],
        pagination: { total: 0, page: 1, limit: 10, totalPages: 0, hasNext: false, hasPrevious: false },
      });

      await getAllReports(mockRequest as any, mockResponse as any, mockNext);

      expect(mockGetAllReports).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should call next with ZodError for invalid query", async () => {
      mockRequest = createReq({ query: { page: "abc" } });

      await getAllReports(mockRequest as any, mockResponse as any, mockNext);

      expect(mockGetAllReports).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
    });
  });

  describe("getReportById", () => {
    const mockReport = { id: 1, status: "PENDING" };

    it("should return a report by ID", async () => {
      mockRequest = createReq({ params: { id: "1" } });
      mockGetReportById.mockResolvedValue(mockReport);

      await getReportById(mockRequest as any, mockResponse as any, mockNext);

      expect(mockGetReportById).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ data: mockReport });
    });

    it("should call next with ReportNotFoundError", async () => {
      mockRequest = createReq({ params: { id: "999" } });
      mockGetReportById.mockRejectedValue(new ReportNotFoundError(999));

      await getReportById(mockRequest as any, mockResponse as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ReportNotFoundError));
    });

    it("should call next with ZodError for invalid id", async () => {
      mockRequest = createReq({ params: { id: "abc" } });

      await getReportById(mockRequest as any, mockResponse as any, mockNext);

      expect(mockGetReportById).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
    });
  });

  describe("updateReportStatus", () => {
    const mockUpdated = { id: 1, status: "REVIEWED", reason: { label: "Spam" } };

    it("should update report status successfully", async () => {
      mockRequest = createReq({
        params: { id: "1" },
        body: { status: "REVIEWED" },
      });
      mockUpdateReportStatus.mockResolvedValue(mockUpdated);

      await updateReportStatus(mockRequest as any, mockResponse as any, mockNext);

      expect(mockUpdateReportStatus).toHaveBeenCalledWith(1, { status: "REVIEWED" });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Report status updated successfully",
        data: mockUpdated,
      });
    });

    it("should call next with ReportNotFoundError", async () => {
      mockRequest = createReq({
        params: { id: "999" },
        body: { status: "REVIEWED" },
      });
      mockUpdateReportStatus.mockRejectedValue(new ReportNotFoundError(999));

      await updateReportStatus(mockRequest as any, mockResponse as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ReportNotFoundError));
    });

    it("should call next with ZodError for invalid status", async () => {
      mockRequest = createReq({
        params: { id: "1" },
        body: { status: "INVALID" },
      });

      await updateReportStatus(mockRequest as any, mockResponse as any, mockNext);

      expect(mockUpdateReportStatus).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
    });
  });

  describe("deleteReport", () => {
    it("should delete a report successfully", async () => {
      mockRequest = createReq({ params: { id: "1" } });
      mockDeleteReport.mockResolvedValue({ id: 1 });

      await deleteReport(mockRequest as any, mockResponse as any, mockNext);

      expect(mockDeleteReport).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Report deleted successfully",
      });
    });

    it("should call next with ReportNotFoundError", async () => {
      mockRequest = createReq({ params: { id: "999" } });
      mockDeleteReport.mockRejectedValue(new ReportNotFoundError(999));

      await deleteReport(mockRequest as any, mockResponse as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ReportNotFoundError));
    });
  });

  describe("toggleVisibility", () => {
    it("should toggle post visibility successfully", async () => {
      mockRequest = createReq({
        body: { resourceType: "post", resourceId: "uuid-123", hidden: true },
      });
      mockToggleVisibility.mockResolvedValue(undefined);

      await toggleVisibility(mockRequest as any, mockResponse as any, mockNext);

      expect(mockToggleVisibility).toHaveBeenCalledWith("post", "uuid-123", true);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Successfully hid post",
      });
    });

    it("should toggle comment visibility successfully", async () => {
      mockRequest = createReq({
        body: { resourceType: "comment", resourceId: 42, hidden: false },
      });
      mockToggleVisibility.mockResolvedValue(undefined);

      await toggleVisibility(mockRequest as any, mockResponse as any, mockNext);

      expect(mockToggleVisibility).toHaveBeenCalledWith("comment", 42, false);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Successfully unhid comment",
      });
    });

    it("should call next with ZodError when hidden field missing", async () => {
      mockRequest = createReq({
        body: { resourceType: "post", resourceId: "uuid-123" },
      });

      await toggleVisibility(mockRequest as any, mockResponse as any, mockNext);

      expect(mockToggleVisibility).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
    });
  });

  describe("getReportStats", () => {
    it("should return report stats", async () => {
      mockRequest = createReq();
      const stats = { totalReports: 10, pending: 5, reviewed: 3, dismissed: 2, hiddenContent: 7 };
      mockGetReportStats.mockResolvedValue(stats);

      await getReportStats(mockRequest as any, mockResponse as any, mockNext);

      expect(mockGetReportStats).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ data: stats });
    });
  });
});
