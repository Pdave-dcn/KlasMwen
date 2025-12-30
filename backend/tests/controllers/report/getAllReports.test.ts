import { getAllReports } from "../../../src/controllers/report/report.moderator.controller.js";
import prisma from "../../../src/core/config/db.js";
import { AuthorizationError } from "../../../src/core/error/custom/auth.error";
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

vi.mock("../../../src/core/error/index.js", () => ({
  handleError: vi.fn(),
}));

vi.mock("../../../src/core/config/db.js", () => ({
  default: {
    report: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe("getAllReports controller", () => {
  let mockRequest: Request;
  let mockResponse: Response;
  let mockNext: any;
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
      contentType: "post",
      isContentHidden: false,
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
      contentType: "comment",
      isContentHidden: false,
    },
  ];

  beforeEach(() => {
    mockRequest = createMockRequest();
    mockNext = vi.fn();
    mockResponse = createMockResponse();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("Success Cases - Basic Functionality", () => {
    it("should fetch all reports with no filters and default pagination", async () => {
      mockRequest.user = mockAdminUser;
      mockRequest.query = {};
      vi.mocked(prisma.report.findMany).mockResolvedValue(mockReports);
      vi.mocked(prisma.report.count).mockResolvedValue(2);

      await getAllReports(mockRequest, mockResponse, mockNext);

      expect(prisma.report.findMany).toHaveBeenCalledWith({
        where: {},
        select: expect.any(Object),
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: 0, // page 1, default
        take: 10, // default limit
      });
      expect(prisma.report.count).toHaveBeenCalledWith({ where: {} });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: mockReports,
        pagination: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should fetch reports filtered by status (e.g., PENDING)", async () => {
      mockRequest.user = mockAdminUser;
      mockRequest.query = { status: "PENDING" };
      vi.mocked(prisma.report.findMany).mockResolvedValue([mockReports[0]]);
      vi.mocked(prisma.report.count).mockResolvedValue(1);

      await getAllReports(mockRequest, mockResponse, mockNext);

      expect(prisma.report.findMany).toHaveBeenCalledWith({
        where: { status: "PENDING" },
        select: expect.any(Object),
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: 0,
        take: 10,
      });
      expect(prisma.report.count).toHaveBeenCalledWith({
        where: { status: "PENDING" },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: [mockReports[0]],
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        },
      });
    });

    it("should fetch reports filtered by postId", async () => {
      mockRequest.user = mockAdminUser;
      const postId = "a1b2c3d4-e5f6-4789-90ab-cdef01234567";
      mockRequest.query = { postId, resourceType: "post" };
      vi.mocked(prisma.report.findMany).mockResolvedValue([mockReports[0]]);
      vi.mocked(prisma.report.count).mockResolvedValue(1);

      await getAllReports(mockRequest, mockResponse, mockNext);

      expect(prisma.report.findMany).toHaveBeenCalledWith({
        where: { postId, commentId: null }, // commentId null because resourceType=post
        select: expect.any(Object),
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: 0,
        take: 10,
      });
      expect(prisma.report.count).toHaveBeenCalledWith({
        where: { postId, commentId: null },
      });
    });

    it("should fetch reports filtered by commentId", async () => {
      mockRequest.user = mockAdminUser;
      const commentId = 456;
      mockRequest.query = {
        commentId: String(commentId),
        resourceType: "comment",
      };
      vi.mocked(prisma.report.findMany).mockResolvedValue([mockReports[1]]);
      vi.mocked(prisma.report.count).mockResolvedValue(1);

      await getAllReports(mockRequest, mockResponse, mockNext);

      expect(prisma.report.findMany).toHaveBeenCalledWith({
        where: { commentId, postId: null }, // postId null because resourceType=comment
        select: expect.any(Object),
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: 0,
        take: 10,
      });
      expect(prisma.report.count).toHaveBeenCalledWith({
        where: { commentId, postId: null },
      });
    });

    it("should fetch reports with multiple filters applied", async () => {
      mockRequest.user = mockAdminUser;
      mockRequest.query = {
        status: "PENDING",
        postId: "a1b2c3d4-e5f6-4789-90ab-cdef01234567",
        resourceType: "post",
      };
      vi.mocked(prisma.report.findMany).mockResolvedValue([]);
      vi.mocked(prisma.report.count).mockResolvedValue(0);

      await getAllReports(mockRequest, mockResponse, mockNext);

      expect(prisma.report.findMany).toHaveBeenCalledWith({
        where: {
          status: "PENDING",
          postId: "a1b2c3d4-e5f6-4789-90ab-cdef01234567",
          commentId: null,
        },
        select: expect.any(Object),
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: 0,
        take: 10,
      });
      expect(prisma.report.count).toHaveBeenCalledWith({
        where: {
          status: "PENDING",
          postId: "a1b2c3d4-e5f6-4789-90ab-cdef01234567",
          commentId: null,
        },
      });
    });

    it("should return an empty array if no reports are found", async () => {
      mockRequest.user = mockAdminUser;
      mockRequest.query = {};
      vi.mocked(prisma.report.findMany).mockResolvedValue([]);
      vi.mocked(prisma.report.count).mockResolvedValue(0);

      await getAllReports(mockRequest, mockResponse, mockNext);

      expect(prisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
          hasNext: false,
          hasPrevious: false,
        },
      });
    });
  });

  describe("Success Cases - Pagination", () => {
    it("should use default pagination values (page=1, limit=10)", async () => {
      mockRequest.user = mockAdminUser;
      mockRequest.query = {};
      vi.mocked(prisma.report.findMany).mockResolvedValue(mockReports);
      vi.mocked(prisma.report.count).mockResolvedValue(2);

      await getAllReports(mockRequest, mockResponse, mockNext);

      expect(prisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
        })
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: mockReports,
        pagination: expect.objectContaining({
          page: 1,
          limit: 10,
        }),
      });
    });

    it("should handle custom page parameter", async () => {
      mockRequest.user = mockAdminUser;
      mockRequest.query = { page: "2" };
      vi.mocked(prisma.report.findMany).mockResolvedValue([]);
      vi.mocked(prisma.report.count).mockResolvedValue(25);

      await getAllReports(mockRequest, mockResponse, mockNext);

      expect(prisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10, // (page 2 - 1) * 10
          take: 10,
        })
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: [],
        pagination: {
          total: 25,
          page: 2,
          limit: 10,
          totalPages: 3,
          hasNext: true,
          hasPrevious: true,
        },
      });
    });

    it("should handle custom limit parameter", async () => {
      mockRequest.user = mockAdminUser;
      mockRequest.query = { limit: "5" };
      vi.mocked(prisma.report.findMany).mockResolvedValue(mockReports);
      vi.mocked(prisma.report.count).mockResolvedValue(2);

      await getAllReports(mockRequest, mockResponse, mockNext);

      expect(prisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 5,
        })
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: mockReports,
        pagination: expect.objectContaining({
          limit: 5,
        }),
      });
    });

    it("should handle both custom page and limit parameters", async () => {
      mockRequest.user = mockAdminUser;
      mockRequest.query = { page: "3", limit: "20" };
      vi.mocked(prisma.report.findMany).mockResolvedValue([]);
      vi.mocked(prisma.report.count).mockResolvedValue(100);

      await getAllReports(mockRequest, mockResponse, mockNext);

      expect(prisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 40, // (page 3 - 1) * 20
          take: 20,
        })
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: [],
        pagination: {
          total: 100,
          page: 3,
          limit: 20,
          totalPages: 5,
          hasNext: true,
          hasPrevious: true,
        },
      });
    });

    it("should correctly calculate hasNext and hasPrevious on first page", async () => {
      mockRequest.user = mockAdminUser;
      mockRequest.query = { page: "1", limit: "10" };
      vi.mocked(prisma.report.findMany).mockResolvedValue(mockReports);
      vi.mocked(prisma.report.count).mockResolvedValue(25);

      await getAllReports(mockRequest, mockResponse, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith({
        data: mockReports,
        pagination: {
          total: 25,
          page: 1,
          limit: 10,
          totalPages: 3,
          hasNext: true,
          hasPrevious: false,
        },
      });
    });

    it("should correctly calculate hasNext and hasPrevious on last page", async () => {
      mockRequest.user = mockAdminUser;
      mockRequest.query = { page: "3", limit: "10" };
      vi.mocked(prisma.report.findMany).mockResolvedValue([]);
      vi.mocked(prisma.report.count).mockResolvedValue(25);

      await getAllReports(mockRequest, mockResponse, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith({
        data: [],
        pagination: {
          total: 25,
          page: 3,
          limit: 10,
          totalPages: 3,
          hasNext: false,
          hasPrevious: true,
        },
      });
    });

    it("should correctly calculate hasNext and hasPrevious on middle page", async () => {
      mockRequest.user = mockAdminUser;
      mockRequest.query = { page: "2", limit: "10" };
      vi.mocked(prisma.report.findMany).mockResolvedValue([]);
      vi.mocked(prisma.report.count).mockResolvedValue(30);

      await getAllReports(mockRequest, mockResponse, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith({
        data: [],
        pagination: {
          total: 30,
          page: 2,
          limit: 10,
          totalPages: 3,
          hasNext: true,
          hasPrevious: true,
        },
      });
    });

    it("should handle pagination with filters combined", async () => {
      mockRequest.user = mockAdminUser;
      mockRequest.query = {
        status: "PENDING",
        page: "2",
        limit: "5",
      };
      vi.mocked(prisma.report.findMany).mockResolvedValue([]);
      vi.mocked(prisma.report.count).mockResolvedValue(12);

      await getAllReports(mockRequest, mockResponse, mockNext);

      expect(prisma.report.findMany).toHaveBeenCalledWith({
        where: { status: "PENDING" },
        select: expect.any(Object),
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: 5,
        take: 5,
      });
      expect(prisma.report.count).toHaveBeenCalledWith({
        where: { status: "PENDING" },
      });
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: [],
        pagination: {
          total: 12,
          page: 2,
          limit: 5,
          totalPages: 3,
          hasNext: true,
          hasPrevious: true,
        },
      });
    });
  });

  describe("Error Cases - Validation", () => {
    it("should call handleError for invalid page parameter (non-numeric)", async () => {
      // Setup
      mockRequest.user = mockAdminUser;
      mockRequest.query = { page: "invalid" };

      await getAllReports(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(prisma.report.findMany).not.toHaveBeenCalled();
    });

    it("should call handleError for invalid page parameter (zero)", async () => {
      // Setup
      mockRequest.user = mockAdminUser;
      mockRequest.query = { page: "0" };

      await getAllReports(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(prisma.report.findMany).not.toHaveBeenCalled();
    });

    it("should call handleError for invalid page parameter (negative)", async () => {
      // Setup
      mockRequest.user = mockAdminUser;
      mockRequest.query = { page: "-1" };

      await getAllReports(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(prisma.report.findMany).not.toHaveBeenCalled();
    });

    it("should call handleError for invalid limit parameter (non-numeric)", async () => {
      // Setup
      mockRequest.user = mockAdminUser;
      mockRequest.query = { limit: "abc" };

      await getAllReports(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(prisma.report.findMany).not.toHaveBeenCalled();
    });

    it("should call handleError for limit exceeding maximum (101)", async () => {
      // Setup
      mockRequest.user = mockAdminUser;
      mockRequest.query = { limit: "101" };

      await getAllReports(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(prisma.report.findMany).not.toHaveBeenCalled();
    });

    it("should call handleError for invalid status value", async () => {
      // Setup
      mockRequest.user = mockAdminUser;
      mockRequest.query = { status: "INVALID_STATUS" };

      await getAllReports(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(prisma.report.findMany).not.toHaveBeenCalled();
    });

    it("should call handleError for invalid commentId (non-numeric)", async () => {
      // Setup
      mockRequest.user = mockAdminUser;
      mockRequest.query = { commentId: "not-a-number" };

      await getAllReports(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(prisma.report.findMany).not.toHaveBeenCalled();
    });

    it("should call handleError for invalid postId (not UUID)", async () => {
      // Setup
      mockRequest.user = mockAdminUser;
      mockRequest.query = { postId: "not-a-uuid" };

      await getAllReports(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(prisma.report.findMany).not.toHaveBeenCalled();
    });
  });

  describe("Error Cases - Database", () => {
    it("should call handleError when findMany fails", async () => {
      mockRequest.user = mockAdminUser;
      mockRequest.query = {};
      const dbError = new Error("Database query failed unexpectedly");
      vi.mocked(prisma.report.findMany).mockRejectedValue(dbError);
      vi.mocked(prisma.report.count).mockResolvedValue(0);

      await getAllReports(mockRequest, mockResponse, mockNext);

      expect(prisma.report.findMany).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(dbError);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should call handleError when count fails", async () => {
      mockRequest.user = mockAdminUser;
      mockRequest.query = {};
      const dbError = new Error("Database count failed");
      vi.mocked(prisma.report.findMany).mockResolvedValue(mockReports);
      vi.mocked(prisma.report.count).mockRejectedValue(dbError);

      await getAllReports(mockRequest, mockResponse, mockNext);

      expect(prisma.report.count).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(dbError);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should call handleError when both findMany and count fail", async () => {
      mockRequest.user = mockAdminUser;
      mockRequest.query = {};
      const dbError = new Error("Database connection lost");
      vi.mocked(prisma.report.findMany).mockRejectedValue(dbError);
      vi.mocked(prisma.report.count).mockRejectedValue(dbError);

      await getAllReports(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });
});
