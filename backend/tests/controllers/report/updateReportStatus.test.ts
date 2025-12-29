import { ZodError } from "zod";

import { updateReportStatus } from "../../../src/controllers/report/report.moderator.controller.js";
import prisma from "../../../src/core/config/db.js";
import { handleError } from "../../../src/core/error";
import { AuthorizationError } from "../../../src/core/error/custom/auth.error";
import { ReportNotFoundError } from "../../../src/core/error/custom/report.error";

import { createAuthenticatedUser } from "./shared/helpers";
import { createMockRequest, createMockResponse } from "./shared/mocks";

import type { ReportStatus, Role } from "@prisma/client";
import type { Request, Response } from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

vi.mock("../../../src/core/error/index", () => ({
  handleError: vi.fn(),
}));

vi.mock("../../../src/core/config/db.js", () => ({
  default: {
    report: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe("updateReportStatus controller", () => {
  let mockRequest: Request;
  let mockResponse: Response;
  const mockAdminUser = createAuthenticatedUser({ role: "ADMIN" });
  const mockReportId = 42;
  const mockUpdateData = {
    status: "REVIEWED" as ReportStatus,
    moderatorNotes: "Action taken, user warned.",
  };

  const mockUpdatedReport = {
    id: mockReportId,
    status: mockUpdateData.status,
    createdAt: new Date("2025-01-01T10:00:00Z"),
    moderatorNotes: mockUpdateData.moderatorNotes,
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
    reason: { id: 1, label: "Spam" },
    post: { id: "post-xyz", title: "Test Post" },
    comment: null,
    contentType: "post",
    isContentHidden: false,
  };

  beforeEach(() => {
    mockRequest = createMockRequest();
    mockResponse = createMockResponse();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("Success Cases", () => {
    it("should update report status and return 200 with updated data and message", async () => {
      // Setup
      mockRequest.user = mockAdminUser;
      mockRequest.params = { id: String(mockReportId) };
      mockRequest.body = mockUpdateData;

      vi.mocked(prisma.report.findUnique).mockResolvedValue({
        id: mockReportId,
      } as any);
      vi.mocked(prisma.report.update).mockResolvedValue(mockUpdatedReport);

      await updateReportStatus(mockRequest, mockResponse);

      expect(prisma.report.update).toHaveBeenCalledWith({
        where: { id: mockReportId },
        data: mockUpdateData,
        select: expect.any(Object),
      });

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Report status updated successfully",
        data: mockUpdatedReport,
      });
      expect(handleError).not.toHaveBeenCalled();
    });
  });

  describe("Error Cases", () => {
    it("should call handleError when checkAdminAuth fails (unauthorized user)", async () => {
      mockRequest.user = createAuthenticatedUser({ role: "STUDENT" as Role });

      await updateReportStatus(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalledWith(
        expect.any(AuthorizationError),
        mockResponse
      );
    });

    it("should call handleError when URL parameter validation fails (ZodError for ID)", async () => {
      // Setup
      mockRequest.user = mockAdminUser;
      mockRequest.params = { id: "not-a-number" };

      await updateReportStatus(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalledWith(
        expect.any(ZodError),
        mockResponse
      );
    });

    it("should call handleError when request body validation fails (ZodError for Status)", async () => {
      // Setup
      mockRequest.user = mockAdminUser;
      mockRequest.params = { id: String(mockReportId) };
      mockRequest.body = { status: "INVALID_STATUS" };
      // Execute
      await updateReportStatus(mockRequest, mockResponse);

      expect(prisma.report.update).not.toHaveBeenCalled();
      expect(handleError).toHaveBeenCalledWith(
        expect.any(ZodError),
        mockResponse
      );
    });

    it("should call handleError when the report is not found (ReportNotFoundError)", async () => {
      // Setup
      mockRequest.user = mockAdminUser;
      mockRequest.params = { id: String(mockReportId) };
      mockRequest.body = mockUpdateData;

      vi.mocked(prisma.report.findUnique).mockResolvedValue(null);

      await updateReportStatus(mockRequest, mockResponse);

      expect(prisma.report.update).not.toHaveBeenCalled();
      expect(handleError).toHaveBeenCalledWith(
        expect.any(ReportNotFoundError),
        mockResponse
      );
    });

    it("should call handleError for unexpected database errors", async () => {
      // Setup
      mockRequest.user = mockAdminUser;
      mockRequest.params = { id: String(mockReportId) };
      mockRequest.body = mockUpdateData;

      vi.mocked(prisma.report.findUnique).mockResolvedValue({
        id: mockReportId,
      } as any);

      const dbError = new Error("Unique constraint violation");

      vi.mocked(prisma.report.update).mockRejectedValue(dbError);

      await updateReportStatus(mockRequest, mockResponse);

      expect(prisma.report.update).toHaveBeenCalled();
      expect(handleError).toHaveBeenCalledWith(dbError, mockResponse);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });
});
