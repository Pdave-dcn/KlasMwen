import prisma from "../../../core/config/db.js";

import {
  BaseSelectors,
  type CreateReportData,
  type UpdateStatusData,
} from "./reportTypes.js";

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
    where: Prisma.ReportWhereInput,
    pagination?: { page: number; limit: number },
  ) {
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
  static count(where: Prisma.ReportWhereInput) {
    return prisma.report.count({ where });
  }

  /** Count non-dismissed reports for a specific resource */
  static countActiveReports(
    resourceType: "post" | "comment",
    resourceId: string | number,
  ) {
    const relationField =
      resourceType === "post" ? "postId" : ("commentId" as const);
    return prisma.report.count({
      where: {
        [relationField]: resourceId,
        status: { not: "DISMISSED" },
      },
    });
  }

  /** Find the oldest N non-dismissed reports for a resource (ascending by creation date) */
  static findThresholdReports(
    resourceType: "post" | "comment",
    resourceId: string | number,
    threshold: number,
  ) {
    const relationField =
      resourceType === "post" ? "postId" : ("commentId" as const);
    return prisma.report.findMany({
      where: {
        [relationField]: resourceId,
        status: { not: "DISMISSED" },
      },
      orderBy: { createdAt: "asc" },
      take: threshold,
    });
  }

  /** Check whether a post is hidden */
  static findPostHidden(postId: string) {
    return prisma.post.findUnique({
      where: { id: postId },
      select: { hidden: true },
    });
  }

  /** Check whether a comment is hidden */
  static findCommentHidden(commentId: number) {
    return prisma.comment.findUnique({
      where: { id: commentId },
      select: { hidden: true },
    });
  }

  /** Update a post's hidden flag */
  static updatePostHidden(postId: string, hidden: boolean) {
    return prisma.post.update({
      where: { id: postId },
      data: { hidden },
    });
  }

  /** Update a comment's hidden flag */
  static updateCommentHidden(commentId: number, hidden: boolean) {
    return prisma.comment.update({
      where: { id: commentId },
      data: { hidden },
    });
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
