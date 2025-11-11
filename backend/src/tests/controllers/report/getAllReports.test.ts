import { getAllReports } from "../../../controllers/report.controller";
import prisma from "../../../core/config/db.js";
import { handleError } from "../../../core/error";
import { AuthorizationError } from "../../../core/error/custom/auth.error";

import { createAuthenticatedUser } from "./shared/helpers";
import { createMockRequest, createMockResponse } from "./shared/mocks";

import type { ReportStatus, Role } from "@prisma/client";
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

vi.mock("../../../core/error/index", () => ({
  handleError: vi.fn(),
}));

vi.mock("../../../core/config/db.js", () => ({
  default: {
    report: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe("getAllReports controller", () => {
  let mockRequest: Request;
  let mockResponse: Response;
  const mockAdminUser = createAuthenticatedUser({ role: "ADMIN" });

  const mockReports = [
    {
      id: 1,
      status: "PENDING" as ReportStatus,
      createdAt: new Date("2025-01-01T10:00:00Z"),
      moderatorNotes: null,
      reporterId: "user-1",
      reasonId: 1,

      postId: "post-1",
      commentId: null,
      reporter: {
        id: "user-1",
        username: "rep1",
        email: "e1@a.com",
        role: "STUDENT" as Role,
      },
      reason: { id: 1, label: "Spam" },
      post: { id: "post-1", title: "Post 1" },
      comment: null,
    },
    {
      id: 2,
      status: "REVIEWED" as ReportStatus,
      createdAt: new Date("2025-01-02T10:00:00Z"),
      moderatorNotes: "Reviewed and dismissed.",
      reporterId: "user-2",
      reasonId: 2,

      postId: null,
      commentId: 101,
      reporter: {
        id: "user-2",
        username: "rep2",
        email: "e2@a.com",
        role: "STUDENT" as Role,
      },
      reason: { id: 2, label: "Hate Speech" },
      post: null,
      comment: { id: 101, content: "Comment 1" },
    },
  ];

  beforeEach(() => {
    mockRequest = createMockRequest();
    mockResponse = createMockResponse();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("Success Cases", () => {
    it("should fetch all reports with no filters and return 200", async () => {
      // Setup
      mockRequest.user = mockAdminUser;
      mockRequest.query = {};
      vi.mocked(prisma.report.findMany).mockResolvedValue(mockReports);

      // Execute
      await getAllReports(mockRequest, mockResponse);

      // Assertions
      expect(prisma.report.findMany).toHaveBeenCalledWith({
        where: {}, // No filters applied
        select: expect.any(Object),
        orderBy: { createdAt: "desc" },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ data: mockReports });
      expect(handleError).not.toHaveBeenCalled();
    });

    it("should fetch reports filtered by status (e.g., PENDING)", async () => {
      // Setup
      mockRequest.user = mockAdminUser;
      mockRequest.query = { status: "PENDING" };
      vi.mocked(prisma.report.findMany).mockResolvedValue([mockReports[0]]);

      // Execute
      await getAllReports(mockRequest, mockResponse);

      // Assertions
      expect(prisma.report.findMany).toHaveBeenCalledWith({
        where: { status: "PENDING" },
        select: expect.any(Object),
        orderBy: { createdAt: "desc" },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: [mockReports[0]],
      });
    });

    it("should fetch reports filtered by postId", async () => {
      // Setup
      mockRequest.user = mockAdminUser;
      const postId = "post-123";
      mockRequest.query = { postId };
      vi.mocked(prisma.report.findMany).mockResolvedValue([mockReports[0]]);

      // Execute
      await getAllReports(mockRequest, mockResponse);

      // Assertions
      expect(prisma.report.findMany).toHaveBeenCalledWith({
        where: { postId },
        select: expect.any(Object),
        orderBy: { createdAt: "desc" },
      });
    });

    it("should fetch reports filtered by commentId", async () => {
      // Setup
      mockRequest.user = mockAdminUser;
      const commentId = 456;
      mockRequest.query = { commentId: String(commentId) }; // Query params are strings
      vi.mocked(prisma.report.findMany).mockResolvedValue([mockReports[1]]);

      // Execute
      await getAllReports(mockRequest, mockResponse);

      // Assertions
      expect(prisma.report.findMany).toHaveBeenCalledWith({
        where: { commentId },
        select: expect.any(Object),
        orderBy: { createdAt: "desc" },
      });
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: [mockReports[1]],
      });
    });

    it("should fetch reports with multiple filters applied", async () => {
      // Setup
      mockRequest.user = mockAdminUser;
      mockRequest.query = { status: "PENDING", postId: "post-789" };
      vi.mocked(prisma.report.findMany).mockResolvedValue([]);

      // Execute
      await getAllReports(mockRequest, mockResponse);

      // Assertions
      expect(prisma.report.findMany).toHaveBeenCalledWith({
        where: { status: "PENDING", postId: "post-789" },
        select: expect.any(Object),
        orderBy: { createdAt: "desc" },
      });
      expect(mockResponse.json).toHaveBeenCalledWith({ data: [] });
    });

    it("should return an empty array if no reports are found", async () => {
      // Setup
      mockRequest.user = mockAdminUser;
      mockRequest.query = {};
      vi.mocked(prisma.report.findMany).mockResolvedValue([]);

      // Execute
      await getAllReports(mockRequest, mockResponse);

      // Assertions
      expect(prisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ data: [] });
    });
  });

  // --- Error Cases ---
  describe("Error Cases", () => {
    it("should call handleError when checkAdminAuth fails (unauthorized user)", async () => {
      // Setup: Use a regular user or undefined user
      mockRequest.user = createAuthenticatedUser({
        id: "non-admin-id",
        role: "STUDENT" as Role,
      });

      // Execute
      await getAllReports(mockRequest, mockResponse);

      // Assertions
      expect(handleError).toHaveBeenCalledWith(
        expect.any(AuthorizationError),
        mockResponse
      );
      expect(prisma.report.findMany).not.toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should call handleError for unexpected database errors", async () => {
      // Setup
      mockRequest.user = mockAdminUser;
      mockRequest.query = {};
      const dbError = new Error("Database query failed unexpectedly");
      vi.mocked(prisma.report.findMany).mockRejectedValue(dbError);

      // Execute
      await getAllReports(mockRequest, mockResponse);

      // Assertions
      expect(prisma.report.findMany).toHaveBeenCalled();
      expect(handleError).toHaveBeenCalledWith(dbError, mockResponse);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });
});
