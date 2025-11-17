import prisma from "../../../core/config/db";

import ReportTransFormer from "./reportTransformer";
import {
  BaseSelectors,
  type CreateReportData,
  type UpdateStatusData,
  type ReportFilters,
} from "./reportTypes";

import type { Prisma } from "@prisma/client";

class ReportRepository {
  /** Find a single report by ID (admin or internal use) */
  static async findUnique(reportId: number) {
    return await prisma.report.findUnique({
      where: { id: reportId },
      select: BaseSelectors.report,
    });
  }

  /** Find all reports, optionally filtered by status, postId, or commentId */
  static async findAll(
    filters?: ReportFilters,
    pagination?: {
      page: number;
      limit: number;
    }
  ) {
    const where: Prisma.ReportWhereInput = {};

    if (filters?.status) where.status = filters.status;
    if (filters?.reasonId) where.reasonId = filters.reasonId;
    if (filters?.postId) where.postId = filters.postId;
    if (filters?.commentId) where.commentId = filters.commentId;

    if (filters?.resourceType) {
      if (filters.resourceType === "post") {
        where.commentId = null;
      }

      if (filters.resourceType === "comment") {
        where.postId = null;
      }
    }

    // Date filtering
    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};

      if (filters.dateFrom) {
        // Start of day local time
        where.createdAt.gte = ReportTransFormer.parseLocalDate(
          filters.dateFrom
        );
      }

      if (filters.dateTo) {
        // End of day local time
        const endDate = ReportTransFormer.parseLocalDate(filters.dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 10;
    const skip = (page - 1) * limit;

    return await prisma.report.findMany({
      where,
      select: BaseSelectors.report,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip,
      take: limit,
    });
  }

  /** Create a new report */
  static async create(data: CreateReportData) {
    return await prisma.report.create({
      data: {
        reporterId: data.reporterId,
        reasonId: data.reasonId,
        commentId: data.commentId ?? null,
        postId: data.postId ?? null,
      },
      select: BaseSelectors.report,
    });
  }

  /** Update a report's status (admin/moderator action) */
  static async updateStatus(reportId: number, data: UpdateStatusData) {
    return await prisma.report.update({
      where: { id: reportId },
      data: {
        status: data.status,
        moderatorNotes: data.moderatorNotes ?? null,
      },
      select: BaseSelectors.report,
    });
  }

  /** Delete a report */
  static async delete(reportId: number) {
    return await prisma.report.delete({
      where: { id: reportId },
      select: BaseSelectors.report,
    });
  }

  /** Get all active report reasons */
  static async getActiveReasons() {
    return await prisma.reportReason.findMany({
      where: { active: true },
      select: BaseSelectors.reportReason,
      orderBy: { id: "asc" },
    });
  }

  /** Find reports for a specific user (reporter) */
  static async findByReporter(reporterId: string) {
    return await prisma.report.findMany({
      where: { reporterId },
      select: BaseSelectors.report,
      orderBy: { createdAt: "desc" },
    });
  }

  /** Count total reports, optionally filtered by status or post/comment */
  static count(filters?: ReportFilters) {
    const where: Prisma.ReportWhereInput = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.reasonId) where.reasonId = filters.reasonId;
    if (filters?.postId) where.postId = filters.postId;
    if (filters?.commentId) where.commentId = filters.commentId;

    if (filters?.resourceType) {
      if (filters.resourceType === "post") {
        where.commentId = null;
      }

      if (filters.resourceType === "comment") {
        where.postId = null;
      }
    }

    // Date filtering
    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};

      if (filters.dateFrom) {
        // Start of day local time
        where.createdAt.gte = ReportTransFormer.parseLocalDate(
          filters.dateFrom
        );
      }

      if (filters.dateTo) {
        // End of day local time
        const endDate = ReportTransFormer.parseLocalDate(filters.dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    return prisma.report.count({ where });
  }

  /** Get statistics about reports and hidden content */
  static async getStats() {
    const [
      totalReports,
      pendingCount,
      reviewedCount,
      dismissedCount,
      hiddenPostsCount,
      hiddenCommentsCount,
    ] = await Promise.all([
      // Total reports
      prisma.report.count(),

      // Pending reports
      prisma.report.count({
        where: { status: "PENDING" },
      }),

      // Reviewed reports
      prisma.report.count({
        where: { status: "REVIEWED" },
      }),

      // Dismissed reports
      prisma.report.count({
        where: { status: "DISMISSED" },
      }),

      // Hidden posts
      prisma.post.count({
        where: { hidden: true },
      }),

      // Hidden comments
      prisma.comment.count({
        where: { hidden: true },
      }),
    ]);

    return {
      totalReports,
      pending: pendingCount,
      reviewed: reviewedCount,
      dismissed: dismissedCount,
      hiddenContent: hiddenPostsCount + hiddenCommentsCount,
    };
  }
}

export default ReportRepository;
