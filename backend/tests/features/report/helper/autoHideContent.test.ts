import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import prisma from "../../../../src/core/config/db";
import { autoHideContent } from "../../../../src/features/report/helpers/autoHideContent";

import type { ReportStatus } from "@prisma/client";

// Mock Prisma client
vi.mock("../../../../src/core/config/db", () => ({
  default: {
    report: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    post: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    comment: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe("autoHideContent", () => {
  // Helper function to create mock reports
  const createMockReports = (
    count: number,
    resourceType: "post" | "comment",
    resourceId: string | number,
    createdAt: Date,
    status: ReportStatus = "PENDING"
  ) => {
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      postId: resourceType === "post" ? (resourceId as string) : null,
      commentId: resourceType === "comment" ? (resourceId as number) : null,
      reporterId: `user-${i + 1}`,
      reasonId: 1,
      status,
      moderatorNotes: null,
      createdAt,
    }));
  };

  const mockPost = {
    id: "post-123",
    title: "Test Post",
    content: "Content",
    type: "NOTE" as const,
    authorId: "user-123",
    createdAt: new Date(),
    updatedAt: new Date(),
    hidden: false,
    fileUrl: null,
    fileName: null,
    fileSize: null,
    mimeType: null,
  };

  const mockComment = {
    id: 456,
    content: "Test comment",
    postId: "post-123",
    authorId: "user-456",
    parentId: null,
    mentionedUserId: null,
    createdAt: new Date(),
    hidden: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-10T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("posts", () => {
    it("should not hide post when report count is below threshold", async () => {
      vi.mocked(prisma.report.count).mockResolvedValue(3);

      await autoHideContent({
        resourceType: "post",
        resourceId: "post-123",
        threshold: 5,
      });

      expect(prisma.report.count).toHaveBeenCalledWith({
        where: {
          postId: "post-123",
          status: { not: "DISMISSED" },
        },
      });
      expect(prisma.report.findMany).not.toHaveBeenCalled();
      expect(prisma.post.update).not.toHaveBeenCalled();
    });

    it("should not hide post when grace period has not elapsed", async () => {
      const recentTime = new Date("2024-01-09T23:00:00Z"); // 1 hour ago

      vi.mocked(prisma.report.count).mockResolvedValue(5);
      vi.mocked(prisma.report.findMany).mockResolvedValue(
        createMockReports(5, "post", "post-123", recentTime)
      );

      await autoHideContent({
        resourceType: "post",
        resourceId: "post-123",
        threshold: 5,
        gracePeriodMs: 24 * 60 * 60 * 1000, // 24 hours
      });

      expect(prisma.report.findMany).toHaveBeenCalledWith({
        where: {
          postId: "post-123",
          status: { not: "DISMISSED" },
        },
        orderBy: { createdAt: "asc" },
        take: 5,
      });
      expect(prisma.post.findUnique).not.toHaveBeenCalled();
      expect(prisma.post.update).not.toHaveBeenCalled();
    });

    it("should hide post when threshold is reached and grace period has elapsed", async () => {
      const oldTime = new Date("2024-01-08T00:00:00Z"); // 48 hours ago

      vi.mocked(prisma.report.count).mockResolvedValue(5);
      vi.mocked(prisma.report.findMany).mockResolvedValue(
        createMockReports(5, "post", "post-123", oldTime)
      );
      vi.mocked(prisma.post.findUnique).mockResolvedValue(mockPost);

      await autoHideContent({
        resourceType: "post",
        resourceId: "post-123",
        threshold: 5,
        gracePeriodMs: 24 * 60 * 60 * 1000,
      });

      expect(prisma.post.findUnique).toHaveBeenCalledWith({
        where: { id: "post-123" },
        select: { hidden: true },
      });
      expect(prisma.post.update).toHaveBeenCalledWith({
        where: { id: "post-123" },
        data: { hidden: true },
      });
    });

    it("should not hide post if already hidden", async () => {
      const oldTime = new Date("2024-01-08T00:00:00Z");

      vi.mocked(prisma.report.count).mockResolvedValue(5);
      vi.mocked(prisma.report.findMany).mockResolvedValue(
        createMockReports(5, "post", "post-123", oldTime)
      );
      vi.mocked(prisma.post.findUnique).mockResolvedValue({
        ...mockPost,
        hidden: true,
      });

      await autoHideContent({
        resourceType: "post",
        resourceId: "post-123",
      });

      expect(prisma.post.findUnique).toHaveBeenCalled();
      expect(prisma.post.update).not.toHaveBeenCalled();
    });

    it("should use custom threshold when provided", async () => {
      vi.mocked(prisma.report.count).mockResolvedValue(2);

      await autoHideContent({
        resourceType: "post",
        resourceId: "post-123",
        threshold: 3,
      });

      expect(prisma.report.count).toHaveBeenCalledWith({
        where: {
          postId: "post-123",
          status: { not: "DISMISSED" },
        },
      });
      expect(prisma.post.update).not.toHaveBeenCalled();
    });

    it("should use custom grace period when provided", async () => {
      const recentTime = new Date("2024-01-09T23:30:00Z"); // 30 minutes ago

      vi.mocked(prisma.report.count).mockResolvedValue(5);
      vi.mocked(prisma.report.findMany).mockResolvedValue(
        createMockReports(5, "post", "post-123", recentTime)
      );
      vi.mocked(prisma.post.findUnique).mockResolvedValue(mockPost);

      // Should not hide with 1 hour grace period
      await autoHideContent({
        resourceType: "post",
        resourceId: "post-123",
        threshold: 5,
        gracePeriodMs: 60 * 60 * 1000, // 1 hour
      });

      expect(prisma.post.update).not.toHaveBeenCalled();

      // Should hide with 15 minutes grace period
      await autoHideContent({
        resourceType: "post",
        resourceId: "post-123",
        threshold: 5,
        gracePeriodMs: 15 * 60 * 1000, // 15 minutes
      });

      expect(prisma.post.update).toHaveBeenCalledWith({
        where: { id: "post-123" },
        data: { hidden: true },
      });
    });
  });

  describe("comments", () => {
    it("should not hide comment when report count is below threshold", async () => {
      vi.mocked(prisma.report.count).mockResolvedValue(2);

      await autoHideContent({
        resourceType: "comment",
        resourceId: 456,
        threshold: 5,
      });

      expect(prisma.report.count).toHaveBeenCalledWith({
        where: {
          commentId: 456,
          status: { not: "DISMISSED" },
        },
      });
      expect(prisma.comment.update).not.toHaveBeenCalled();
    });

    it("should hide comment when threshold is reached and grace period has elapsed", async () => {
      const oldTime = new Date("2024-01-08T00:00:00Z");

      vi.mocked(prisma.report.count).mockResolvedValue(5);
      vi.mocked(prisma.report.findMany).mockResolvedValue(
        createMockReports(5, "comment", 456, oldTime)
      );
      vi.mocked(prisma.comment.findUnique).mockResolvedValue(mockComment);

      await autoHideContent({
        resourceType: "comment",
        resourceId: 456,
      });

      expect(prisma.comment.findUnique).toHaveBeenCalledWith({
        where: { id: 456 },
        select: { hidden: true },
      });
      expect(prisma.comment.update).toHaveBeenCalledWith({
        where: { id: 456 },
        data: { hidden: true },
      });
    });

    it("should not hide comment if already hidden", async () => {
      const oldTime = new Date("2024-01-08T00:00:00Z");

      vi.mocked(prisma.report.count).mockResolvedValue(5);
      vi.mocked(prisma.report.findMany).mockResolvedValue(
        createMockReports(5, "comment", 789, oldTime)
      );
      vi.mocked(prisma.comment.findUnique).mockResolvedValue({
        ...mockComment,
        id: 789,
        hidden: true,
      });

      await autoHideContent({
        resourceType: "comment",
        resourceId: 789,
      });

      expect(prisma.comment.findUnique).toHaveBeenCalled();
      expect(prisma.comment.update).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("should return early if no threshold reports found", async () => {
      vi.mocked(prisma.report.count).mockResolvedValue(5);
      vi.mocked(prisma.report.findMany).mockResolvedValue([]);

      await autoHideContent({
        resourceType: "post",
        resourceId: "post-999",
      });

      expect(prisma.report.findMany).toHaveBeenCalled();
      expect(prisma.post.findUnique).not.toHaveBeenCalled();
    });

    it("should handle exactly threshold count", async () => {
      const oldTime = new Date("2024-01-08T00:00:00Z");

      vi.mocked(prisma.report.count).mockResolvedValue(3);
      vi.mocked(prisma.report.findMany).mockResolvedValue(
        createMockReports(3, "post", "post-exact", oldTime)
      );
      vi.mocked(prisma.post.findUnique).mockResolvedValue({
        ...mockPost,
        id: "post-exact",
      });

      await autoHideContent({
        resourceType: "post",
        resourceId: "post-exact",
        threshold: 3,
      });

      expect(prisma.post.update).toHaveBeenCalled();
    });

    it("should exclude dismissed reports from count", async () => {
      vi.mocked(prisma.report.count).mockResolvedValue(4);

      await autoHideContent({
        resourceType: "post",
        resourceId: "post-dismissed",
        threshold: 5,
      });

      expect(prisma.report.count).toHaveBeenCalledWith({
        where: {
          postId: "post-dismissed",
          status: { not: "DISMISSED" },
        },
      });
      expect(prisma.post.update).not.toHaveBeenCalled();
    });

    it("should handle grace period at exact boundary", async () => {
      const exactTime = new Date("2024-01-09T00:00:00Z"); // Exactly 24 hours ago

      vi.mocked(prisma.report.count).mockResolvedValue(5);
      vi.mocked(prisma.report.findMany).mockResolvedValue(
        createMockReports(5, "post", "post-boundary", exactTime)
      );
      vi.mocked(prisma.post.findUnique).mockResolvedValue({
        ...mockPost,
        id: "post-boundary",
      });

      await autoHideContent({
        resourceType: "post",
        resourceId: "post-boundary",
        threshold: 5,
        gracePeriodMs: 24 * 60 * 60 * 1000,
      });

      // Should hide since elapsed >= gracePeriodMs
      expect(prisma.post.update).toHaveBeenCalled();
    });
  });
});
