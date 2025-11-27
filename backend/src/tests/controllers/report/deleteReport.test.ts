import { ZodError } from "zod";

import { deleteReport } from "../../../controllers/report/report.moderator.controller.js";
import prisma from "../../../core/config/db.js";
import { handleError } from "../../../core/error";
import { AuthorizationError } from "../../../core/error/custom/auth.error";
import { ReportNotFoundError } from "../../../core/error/custom/report.error";

import { createAuthenticatedUser } from "./shared/helpers";
import { createMockRequest, createMockResponse } from "./shared/mocks";

import type { ReportStatus, Role } from "@prisma/client";
import type { Request, Response } from "express";

// 1. Mock the logger
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
  controllerLogger: {
    child: vi.fn(() => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    })),
  },
}));

vi.mock("../../../core/error/index", () => ({
  handleError: vi.fn(),
}));

vi.mock("../../../core/config/db.js", () => ({
  default: {
    report: {
      delete: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

// --- TEST SUITE ---

describe("deleteReport controller", () => {
  let mockRequest: Request;
  let mockResponse: Response;
  const mockAdminUser = createAuthenticatedUser({ role: "ADMIN" });
  const mockReportId = 99;

  const mockDeletedReport = {
    id: mockReportId,
    status: "PENDING" as ReportStatus,
    createdAt: new Date("2025-01-01T10:00:00Z"),
    moderatorNotes: null,
    reporterId: "user-abc",
    reasonId: 1,
    postId: "post-xyz",
    commentId: null,
    reporter: {
      id: "user-abc",
      username: "repUser",
      email: "rep@a.com",
      role: "STUDENT" as Role,
    },
    reason: { id: 1, label: "Mock Test Reason" },
    post: { id: "post-xyz", title: "Test Post" },
    comment: null,
  };

  beforeEach(() => {
    mockRequest = createMockRequest();
    mockResponse = createMockResponse();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // --- Success Case ---
  describe("Success Case", () => {
    it("should successfully delete a report and return 200 with a success message", async () => {
      // Setup
      mockRequest.user = mockAdminUser;
      mockRequest.params = { id: String(mockReportId) };
      vi.mocked(prisma.report.delete).mockResolvedValue(mockDeletedReport);

      vi.mocked(prisma.report.findUnique).mockResolvedValue({
        id: mockReportId,
      } as any);

      await deleteReport(mockRequest, mockResponse);

      expect(prisma.report.delete).toHaveBeenCalledWith({
        where: { id: mockReportId },
        select: expect.any(Object),
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Report deleted successfully",
      });
      expect(handleError).not.toHaveBeenCalled();
    });
  });

  // --- Error Cases ---
  describe("Error Cases", () => {
    it("should call handleError when checkAdminAuth fails (unauthorized user)", async () => {
      // Setup
      mockRequest.user = createAuthenticatedUser({ role: "STUDENT" as Role });
      mockRequest.params = { id: String(mockReportId) };

      vi.mocked(prisma.report.findUnique).mockResolvedValue({
        id: mockReportId,
      } as any);

      await deleteReport(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalledWith(
        expect.any(AuthorizationError),
        mockResponse
      );
      expect(prisma.report.delete).not.toHaveBeenCalled();
    });

    it("should call handleError when ID validation fails (invalid format)", async () => {
      // Setup
      mockRequest.user = mockAdminUser;
      mockRequest.params = { id: "invalid-id-string" };
      await deleteReport(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalledWith(
        expect.any(ZodError),
        mockResponse
      );
      expect(prisma.report.delete).not.toHaveBeenCalled();
    });

    it("should call handleError when the report is not found (ReportNotFoundError)", async () => {
      // Setup
      mockRequest.user = mockAdminUser;
      mockRequest.params = { id: String(mockReportId) };

      vi.mocked(prisma.report.findUnique).mockResolvedValue(null);

      // Execute
      await deleteReport(mockRequest, mockResponse);

      // Assertions
      expect(prisma.report.delete).not.toHaveBeenCalled();
      expect(handleError).toHaveBeenCalledWith(
        expect.any(ReportNotFoundError),
        mockResponse
      );
    });

    it("should call handleError for unexpected database errors", async () => {
      // Setup
      mockRequest.user = mockAdminUser;
      mockRequest.params = { id: String(mockReportId) };
      const dbError = new Error("Disk is full");

      vi.mocked(prisma.report.findUnique).mockResolvedValue({
        id: mockReportId,
      } as any);

      // Mock prisma delete to reject
      vi.mocked(prisma.report.delete).mockRejectedValue(dbError);

      // Execute
      await deleteReport(mockRequest, mockResponse);

      // Assertions
      expect(prisma.report.delete).toHaveBeenCalled();
      expect(handleError).toHaveBeenCalledWith(dbError, mockResponse);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });
});
