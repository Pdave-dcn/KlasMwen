import { describe, it, expect, vi, beforeEach } from "vitest";

import { ReportNotFoundError } from "../../../../src/core/error/custom/report.error.js";

const mockFindAll = vi.fn();
const mockCount = vi.fn();
const mockCreate = vi.fn();
const mockFindUnique = vi.fn();
const mockUpdateStatus = vi.fn();
const mockDelete = vi.fn();
const mockGetActiveReasons = vi.fn();
const mockGetStats = vi.fn();
const mockUpdatePostHidden = vi.fn();
const mockUpdateCommentHidden = vi.fn();

const mockVerifyPostExists = vi.fn();
const mockCommentExists = vi.fn();

const mockAssertPermission = vi.fn();

const mockEnrichReports = vi.fn();
const mockEnrichReport = vi.fn();

const mockParseLocalDate = vi.fn();
const mockReportCount = vi.fn();
const mockReportFindMany = vi.fn();
const mockPostFindUnique = vi.fn();
const mockPostUpdate = vi.fn();
const mockCommentFindUnique = vi.fn();
const mockCommentUpdate = vi.fn();

vi.mock("../../../../src/features/report/service/reportRepository.js", () => ({
  default: {
    findAll: (...args: unknown[]) => mockFindAll(...args),
    count: (...args: unknown[]) => mockCount(...args),
    create: (...args: unknown[]) => mockCreate(...args),
    findUnique: (...args: unknown[]) => mockFindUnique(...args),
    updateStatus: (...args: unknown[]) => mockUpdateStatus(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
    getActiveReasons: (...args: unknown[]) => mockGetActiveReasons(...args),
    getStats: (...args: unknown[]) => mockGetStats(...args),
    updatePostHidden: (...args: unknown[]) => mockUpdatePostHidden(...args),
    updateCommentHidden: (...args: unknown[]) =>
      mockUpdateCommentHidden(...args),
  },
}));

vi.mock("../../../../src/features/posts/service/PostService.js", () => ({
  postService: {
    validate: {
      verifyPostExists: (...args: unknown[]) => mockVerifyPostExists(...args),
    },
  },
}));

vi.mock("../../../../src/features/comment/service/index.js", () => ({
  commentService: {
    validate: {
      commentExists: (...args: unknown[]) => mockCommentExists(...args),
    },
  },
}));

vi.mock("../../../../src/core/security/rbac.js", () => ({
  assertPermission: (...args: unknown[]) => mockAssertPermission(...args),
}));

vi.mock("../../../../src/features/report/service/reportEnricher.js", () => ({
  default: {
    enrichReports: (...args: unknown[]) => mockEnrichReports(...args),
    enrichReport: (...args: unknown[]) => mockEnrichReport(...args),
  },
}));

vi.mock("../../../../src/features/report/service/reportTransformer.js", () => ({
  default: {
    parseLocalDate: (...args: unknown[]) => mockParseLocalDate(...args),
  },
}));

vi.mock("../../../../src/core/config/db.js", () => ({
  default: {
    report: {
      count: (...args: unknown[]) => mockReportCount(...args),
      findMany: (...args: unknown[]) => mockReportFindMany(...args),
    },
    post: {
      findUnique: (...args: unknown[]) => mockPostFindUnique(...args),
      update: (...args: unknown[]) => mockPostUpdate(...args),
    },
    comment: {
      findUnique: (...args: unknown[]) => mockCommentFindUnique(...args),
      update: (...args: unknown[]) => mockCommentUpdate(...args),
    },
  },
}));

import { reportService } from "../../../../src/features/report/service/index.js";

const mockUser = {
  id: "910da3f7-f419-4929-b775-6e26ba17f248",
  username: "testUser",
  email: "test@example.com",
  role: "STUDENT",
};

const mockPostId = "6b2efb09-e634-41d9-b2eb-d4972fabb729";
const mockCommentId = 42;
const mockReasonId = 1;

describe("ReportService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAllReports", () => {
    const mockReports = [
      { id: 1, status: "PENDING" },
      { id: 2, status: "REVIEWED" },
    ];
    const mockEnriched = [
      { id: 1, status: "PENDING", contentType: "post", isContentHidden: false },
      { id: 2, status: "REVIEWED", contentType: "post", isContentHidden: true },
    ];

    it("should return paginated reports with enriched data", async () => {
      mockFindAll.mockResolvedValue(mockReports);
      mockCount.mockResolvedValue(10);
      mockEnrichReports.mockReturnValue(mockEnriched);

      const result = await reportService.getAllReports(
        { status: "PENDING" },
        { page: 1, limit: 5 },
      );

      expect(mockFindAll).toHaveBeenCalledTimes(1);
      expect(mockCount).toHaveBeenCalledTimes(1);
      expect(mockEnrichReports).toHaveBeenCalledWith(mockReports);
      expect(result).toEqual({
        data: mockEnriched,
        pagination: {
          total: 10,
          page: 1,
          limit: 5,
          totalPages: 2,
          hasNext: true,
          hasPrevious: false,
        },
      });
    });

    it("should use default pagination when none provided", async () => {
      mockFindAll.mockResolvedValue([]);
      mockCount.mockResolvedValue(0);
      mockEnrichReports.mockReturnValue([]);

      const result = await reportService.getAllReports();

      expect(mockFindAll).toHaveBeenCalledWith(expect.any(Object), undefined);
      expect(result.pagination).toMatchObject({ page: 1, limit: 10 });
    });

    it("should apply resourceType filter for posts", async () => {
      mockFindAll.mockResolvedValue([]);
      mockCount.mockResolvedValue(0);
      mockEnrichReports.mockReturnValue([]);

      await reportService.getAllReports({
        resourceType: "post",
        postId: mockPostId,
      });

      const whereArg = mockFindAll.mock.calls[0][0];
      expect(whereArg.postId).toBe(mockPostId);
      expect(whereArg.commentId).toBeNull();
    });

    it("should apply resourceType filter for comments", async () => {
      mockFindAll.mockResolvedValue([]);
      mockCount.mockResolvedValue(0);
      mockEnrichReports.mockReturnValue([]);

      await reportService.getAllReports({
        resourceType: "comment",
        commentId: mockCommentId,
      });

      const whereArg = mockFindAll.mock.calls[0][0];
      expect(whereArg.commentId).toBe(mockCommentId);
      expect(whereArg.postId).toBeNull();
    });

    it("should handle date range filters", async () => {
      const mockDate = new Date("2024-01-15");
      mockParseLocalDate.mockReturnValue(mockDate);
      mockFindAll.mockResolvedValue([]);
      mockCount.mockResolvedValue(0);
      mockEnrichReports.mockReturnValue([]);

      await reportService.getAllReports({
        dateFrom: "2024-01-01",
        dateTo: "2024-01-31",
      });

      expect(mockParseLocalDate).toHaveBeenCalledTimes(2);
      const whereArg = mockFindAll.mock.calls[0][0];
      expect(whereArg.createdAt).toBeDefined();
    });
  });

  describe("getReportReasons", () => {
    it("should return active report reasons", async () => {
      const reasons = [{ id: 1, label: "Spam" }];
      mockGetActiveReasons.mockResolvedValue(reasons);

      const result = await reportService.getReportReasons();

      expect(mockGetActiveReasons).toHaveBeenCalled();
      expect(result).toEqual(reasons);
    });

    it("should return empty array when no reasons exist", async () => {
      mockGetActiveReasons.mockResolvedValue([]);

      const result = await reportService.getReportReasons();

      expect(result).toEqual([]);
    });
  });

  describe("getReportById", () => {
    it("should return a report when it exists", async () => {
      const report = { id: 1, status: "PENDING" };
      mockFindUnique.mockResolvedValue(report);

      const result = await reportService.getReportById(1);

      expect(mockFindUnique).toHaveBeenCalledWith(1);
      expect(result).toEqual(report);
    });

    it("should throw ReportNotFoundError when report does not exist", async () => {
      mockFindUnique.mockResolvedValue(null);

      await expect(reportService.getReportById(999)).rejects.toThrow(
        ReportNotFoundError,
      );
      expect(mockFindUnique).toHaveBeenCalledWith(999);
    });
  });

  describe("getReportStats", () => {
    it("should return report stats from repository", async () => {
      const stats = {
        totalReports: 10,
        pending: 5,
        reviewed: 3,
        dismissed: 2,
        hiddenContent: 7,
      };
      mockGetStats.mockResolvedValue(stats);

      const result = await reportService.getReportStats();

      expect(mockGetStats).toHaveBeenCalled();
      expect(result).toEqual(stats);
    });
  });

  describe("createReport", () => {
    const mockPostResource = { id: mockPostId, title: "Test Post" };
    const mockCommentResource = { id: mockCommentId, content: "Test comment" };
    const mockCreatedReport = {
      id: 1,
      status: "PENDING",
      reason: { label: "Spam" },
      reporter: { username: "testUser" },
    };

    it("should create a post report successfully", async () => {
      mockVerifyPostExists.mockResolvedValue(mockPostResource);
      mockAssertPermission.mockReturnValue(undefined);
      mockCreate.mockResolvedValue(mockCreatedReport);
      mockReportCount.mockResolvedValue(0);

      const result = await reportService.createReport(mockUser, {
        postId: mockPostId,
        reasonId: mockReasonId,
        reporterId: mockUser.id,
      });

      expect(mockVerifyPostExists).toHaveBeenCalledWith(mockPostId);
      expect(mockAssertPermission).toHaveBeenCalledWith(
        mockUser,
        "posts",
        "report",
        mockPostResource,
      );
      expect(mockCreate).toHaveBeenCalledWith({
        postId: mockPostId,
        reasonId: mockReasonId,
        reporterId: mockUser.id,
      });
      expect(result).toEqual(mockCreatedReport);
    });

    it("should create a comment report successfully", async () => {
      mockCommentExists.mockResolvedValue(mockCommentResource);
      mockAssertPermission.mockReturnValue(undefined);
      mockCreate.mockResolvedValue(mockCreatedReport);
      mockReportCount.mockResolvedValue(0);

      const result = await reportService.createReport(mockUser, {
        commentId: mockCommentId,
        reasonId: mockReasonId,
        reporterId: mockUser.id,
      });

      expect(mockCommentExists).toHaveBeenCalledWith(mockCommentId);
      expect(mockAssertPermission).toHaveBeenCalledWith(
        mockUser,
        "comments",
        "report",
        mockCommentResource,
      );
      expect(mockCreate).toHaveBeenCalledWith({
        commentId: mockCommentId,
        reasonId: mockReasonId,
        reporterId: mockUser.id,
      });
      expect(result).toEqual(mockCreatedReport);
    });

    it("should throw when post does not exist", async () => {
      mockVerifyPostExists.mockRejectedValue(new Error("Post not found"));

      await expect(
        reportService.createReport(mockUser, {
          postId: mockPostId,
          reasonId: mockReasonId,
          reporterId: mockUser.id,
        }),
      ).rejects.toThrow("Post not found");

      expect(mockCreate).not.toHaveBeenCalled();
    });

    it("should throw when comment does not exist", async () => {
      mockCommentExists.mockRejectedValue(new Error("Comment not found"));

      await expect(
        reportService.createReport(mockUser, {
          commentId: mockCommentId,
          reasonId: mockReasonId,
          reporterId: mockUser.id,
        }),
      ).rejects.toThrow("Comment not found");

      expect(mockCreate).not.toHaveBeenCalled();
    });

    it("should trigger auto-hide content check after creating report", async () => {
      mockVerifyPostExists.mockResolvedValue(mockPostResource);
      mockAssertPermission.mockReturnValue(undefined);
      mockCreate.mockResolvedValue(mockCreatedReport);
      mockReportCount.mockResolvedValue(0);

      await reportService.createReport(mockUser, {
        postId: mockPostId,
        reasonId: mockReasonId,
        reporterId: mockUser.id,
      });

      expect(mockReportCount).toHaveBeenCalled();
    });
  });

  describe("updateReportStatus", () => {
    it("should update status and return enriched report", async () => {
      const report = { id: 1, status: "REVIEWED" };
      const enriched = {
        id: 1,
        status: "REVIEWED",
        contentType: "post",
        isContentHidden: false,
      };
      mockFindUnique.mockResolvedValue(report);
      mockUpdateStatus.mockResolvedValue(report);
      mockEnrichReport.mockReturnValue(enriched);

      const result = await reportService.updateReportStatus(1, {
        status: "REVIEWED",
      });

      expect(mockFindUnique).toHaveBeenCalledWith(1);
      expect(mockUpdateStatus).toHaveBeenCalledWith(1, { status: "REVIEWED" });
      expect(mockEnrichReport).toHaveBeenCalledWith(report);
      expect(result).toEqual(enriched);
    });

    it("should throw when report does not exist", async () => {
      mockFindUnique.mockResolvedValue(null);

      await expect(
        reportService.updateReportStatus(999, { status: "REVIEWED" }),
      ).rejects.toThrow(ReportNotFoundError);

      expect(mockUpdateStatus).not.toHaveBeenCalled();
    });
  });

  describe("deleteReport", () => {
    it("should delete a report when it exists", async () => {
      const report = { id: 1 };
      mockFindUnique.mockResolvedValue(report);
      mockDelete.mockResolvedValue(report);

      const result = await reportService.deleteReport(1);

      expect(mockFindUnique).toHaveBeenCalledWith(1);
      expect(mockDelete).toHaveBeenCalledWith(1);
      expect(result).toEqual(report);
    });

    it("should throw when report does not exist", async () => {
      mockFindUnique.mockResolvedValue(null);

      await expect(reportService.deleteReport(999)).rejects.toThrow(
        ReportNotFoundError,
      );
      expect(mockDelete).not.toHaveBeenCalled();
    });
  });

  describe("toggleVisibility", () => {
    const mockPostResource = { id: mockPostId, title: "Test" };
    const mockCommentResource = { id: mockCommentId, content: "Test" };

    it("should hide a post", async () => {
      mockVerifyPostExists.mockResolvedValue(mockPostResource);
      mockUpdatePostHidden.mockResolvedValue({});

      await reportService.toggleVisibility("post", mockPostId, true);

      expect(mockVerifyPostExists).toHaveBeenCalledWith(mockPostId);
      expect(mockUpdatePostHidden).toHaveBeenCalledWith(mockPostId, true);
    });

    it("should un-hide a post", async () => {
      mockVerifyPostExists.mockResolvedValue(mockPostResource);
      mockUpdatePostHidden.mockResolvedValue({});

      await reportService.toggleVisibility("post", mockPostId, false);

      expect(mockUpdatePostHidden).toHaveBeenCalledWith(mockPostId, false);
    });

    it("should hide a comment", async () => {
      mockCommentExists.mockResolvedValue(mockCommentResource);
      mockUpdateCommentHidden.mockResolvedValue({});

      await reportService.toggleVisibility("comment", mockCommentId, true);

      expect(mockCommentExists).toHaveBeenCalledWith(mockCommentId);
      expect(mockUpdateCommentHidden).toHaveBeenCalledWith(mockCommentId, true);
    });

    it("should un-hide a comment", async () => {
      mockCommentExists.mockResolvedValue(mockCommentResource);
      mockUpdateCommentHidden.mockResolvedValue({});

      await reportService.toggleVisibility("comment", mockCommentId, false);

      expect(mockUpdateCommentHidden).toHaveBeenCalledWith(
        mockCommentId,
        false,
      );
    });

    it("should throw when post does not exist", async () => {
      mockVerifyPostExists.mockRejectedValue(new Error("Post not found"));

      await expect(
        reportService.toggleVisibility("post", mockPostId, true),
      ).rejects.toThrow("Post not found");

      expect(mockUpdatePostHidden).not.toHaveBeenCalled();
    });

    it("should throw when comment does not exist", async () => {
      mockCommentExists.mockRejectedValue(new Error("Comment not found"));

      await expect(
        reportService.toggleVisibility("comment", mockCommentId, true),
      ).rejects.toThrow("Comment not found");

      expect(mockUpdateCommentHidden).not.toHaveBeenCalled();
    });
  });
});
