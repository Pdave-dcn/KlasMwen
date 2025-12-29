import { ZodError } from "zod";

import { getReportById } from "../../../src/controllers/report/report.moderator.controller.js";
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
    },
  },
}));

describe("getReportById controller", () => {
  let mockRequest: Request;
  let mockResponse: Response;
  const mockAdminUser = createAuthenticatedUser({ role: "ADMIN" });
  const mockReportId = 123;

  const mockReport = {
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
    reason: { id: 1, label: "Spam" },
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

  describe("Success Cases", () => {
    it("should fetch a report by ID and return 200", async () => {
      // Setup
      mockRequest.user = mockAdminUser;
      mockRequest.params = { id: String(mockReportId) };
      vi.mocked(prisma.report.findUnique).mockResolvedValue(mockReport);

      await getReportById(mockRequest, mockResponse);

      expect(prisma.report.findUnique).toHaveBeenCalledWith({
        where: { id: mockReportId },
        select: expect.any(Object),
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ data: mockReport });
      expect(handleError).not.toHaveBeenCalled();
    });
  });

  describe("Error Cases", () => {
    it("should call handleError when checkAdminAuth fails (unauthorized user)", async () => {
      // Setup
      mockRequest.user = createAuthenticatedUser({ role: "STUDENT" as Role });
      mockRequest.params = { id: String(mockReportId) };

      await getReportById(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalledWith(
        expect.any(AuthorizationError),
        mockResponse
      );
      expect(prisma.report.findUnique).not.toHaveBeenCalled();
    });

    it("should call handleError when ID validation fails (ZodError)", async () => {
      // Setup
      mockRequest.user = mockAdminUser;
      mockRequest.params = { id: "invalid-id" };

      await getReportById(mockRequest, mockResponse);

      expect(handleError).toHaveBeenCalledWith(
        expect.any(ZodError),
        mockResponse
      );
      expect(prisma.report.findUnique).not.toHaveBeenCalled();
    });

    it("should call handleError when the report is not found (ReportNotFoundError)", async () => {
      // Setup
      mockRequest.user = mockAdminUser;
      mockRequest.params = { id: String(mockReportId) };

      vi.mocked(prisma.report.findUnique).mockResolvedValue(null);

      await getReportById(mockRequest, mockResponse);

      // Assertions
      expect(prisma.report.findUnique).toHaveBeenCalled();
      expect(handleError).toHaveBeenCalledWith(
        expect.any(ReportNotFoundError),
        mockResponse
      );
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should call handleError for unexpected database errors", async () => {
      // Setup
      mockRequest.user = mockAdminUser;
      mockRequest.params = { id: String(mockReportId) };
      const dbError = new Error("Connection timed out");

      // Mock prisma to reject
      vi.mocked(prisma.report.findUnique).mockRejectedValue(dbError);

      // Execute
      await getReportById(mockRequest, mockResponse);

      // Assertions
      expect(prisma.report.findUnique).toHaveBeenCalled();
      expect(handleError).toHaveBeenCalledWith(dbError, mockResponse);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });
});
