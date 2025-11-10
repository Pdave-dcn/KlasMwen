import prisma from "../../../core/config/db";

import { BaseSelectors, type CreateReportData } from "./reportTypes";

import type { Prisma, ReportStatus } from "@prisma/client";

class ReportRepository {
  /** Find a single report by ID (admin or internal use) */
  static async findUnique(reportId: number) {
    return await prisma.report.findUnique({
      where: { id: reportId },
      select: BaseSelectors.report,
    });
  }

  /** Find all reports, optionally filtered by status, postId, or commentId */
  static async findAll(filters?: {
    status?: ReportStatus;
    postId?: string;
    commentId?: number;
  }) {
    const where: Prisma.ReportWhereInput = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.postId) where.postId = filters.postId;
    if (filters?.commentId) where.commentId = filters.commentId;

    return await prisma.report.findMany({
      where,
      select: BaseSelectors.report,
      orderBy: { createdAt: "desc" },
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
  static async updateStatus(reportId: number, status: ReportStatus) {
    return await prisma.report.update({
      where: { id: reportId },
      data: { status },
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
  static count(filters?: {
    status?: ReportStatus;
    postId?: string;
    commentId?: number;
  }) {
    const where: Prisma.ReportWhereInput = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.postId) where.postId = filters.postId;
    if (filters?.commentId) where.commentId = filters.commentId;

    return prisma.report.count({ where });
  }
}

export default ReportRepository;
