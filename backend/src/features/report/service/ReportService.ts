import prisma from "../../../core/config/db.js";
import { ReportNotFoundError } from "../../../core/error/custom/report.error.js";
import { assertPermission } from "../../../core/security/rbac.js";
import { commentService } from "../../comment/service/index.js";
import { postService } from "../../posts/service/PostService.js";

import ReportEnricher from "./reportEnricher.js";
import ReportRepository from "./reportRepository.js";
import ReportTransFormer from "./reportTransformer.js";

import type {
  CreateReportData,
  ReportFilters,
  UpdateStatusData,
} from "./reportTypes.js";
import type { Prisma } from "@prisma/client";

class ReportService {
  private async reportExists(reportId: number) {
    const report = await ReportRepository.findUnique(reportId);
    if (!report) throw new ReportNotFoundError(reportId);
    return true;
  }

  private async contentExists(
    contentType: string,
    contentId: string | number,
  ) {
    if (contentType === "post") {
      return await postService.validate.verifyPostExists(contentId as string);
    }
    if (contentType === "comment") {
      return await commentService.validate.commentExists(contentId as number);
    }
    throw new Error("Unsupported content");
  }

  private async autoHideContent(
    resourceType: "post" | "comment",
    resourceId: string | number,
    threshold = 5,
    gracePeriodMs = 24 * 60 * 60 * 1000,
  ): Promise<void> {
    const relationField = resourceType === "post" ? "postId" : "commentId" as const;

    const reportCount = await prisma.report.count({
      where: {
        [relationField]: resourceId,
        status: { not: "DISMISSED" },
      },
    });

    if (reportCount < threshold) return;

    const thresholdReport = await prisma.report.findMany({
      where: {
        [relationField]: resourceId,
        status: { not: "DISMISSED" },
      },
      orderBy: { createdAt: "asc" },
      take: threshold,
    });

    if (!thresholdReport.length) return;

    const thresholdReachedAt = thresholdReport[thresholdReport.length - 1].createdAt;
    const elapsed = Date.now() - thresholdReachedAt.getTime();
    if (elapsed < gracePeriodMs) return;

    if (resourceType === "post") {
      const post = await prisma.post.findUnique({
        where: { id: resourceId as string },
        select: { hidden: true },
      });
      if (!post?.hidden) {
        await prisma.post.update({
          where: { id: resourceId as string },
          data: { hidden: true },
        });
      }
    } else {
      const comment = await prisma.comment.findUnique({
        where: { id: resourceId as number },
        select: { hidden: true },
      });
      if (!comment?.hidden) {
        await prisma.comment.update({
          where: { id: resourceId as number },
          data: { hidden: true },
        });
      }
    }
  }

  private buildWhere(filters?: ReportFilters): Prisma.ReportWhereInput {
    const where: Prisma.ReportWhereInput = {};

    if (!filters) return where;

    if (filters.status) where.status = filters.status;
    if (filters.reasonId) where.reasonId = filters.reasonId;

    if (filters.resourceType === "post") {
      where.postId = filters.postId ?? undefined;
      where.commentId = null;
    }

    if (filters.resourceType === "comment") {
      where.commentId = filters.commentId ?? undefined;
      where.postId = null;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = ReportTransFormer.parseLocalDate(filters.dateFrom);
      }
      if (filters.dateTo) {
        const endDate = ReportTransFormer.parseLocalDate(filters.dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    return where;
  }

  async getAllReports(
    filters?: ReportFilters,
    pagination?: { page: number; limit: number },
  ) {
    const where = this.buildWhere(filters);

    const [reports, total] = await Promise.all([
      ReportRepository.findAll(where, pagination),
      ReportRepository.count(where),
    ]);

    const enrichedReports = ReportEnricher.enrichReports(reports);

    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 10;
    const totalPages = Math.ceil(total / limit);

    return {
      data: enrichedReports,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  async createReport(user: Express.User, data: CreateReportData) {
    const resourceType = data.postId ? "post" as const : "comment" as const;
    const resourceId: string | number = data.postId ?? data.commentId as number;

    const resource = await this.contentExists(resourceType, resourceId);

    assertPermission(
      user,
      data.postId ? "posts" : "comments",
      "report",
      resource,
    );

    const newReport = await ReportRepository.create(data);
    void this.autoHideContent(resourceType, resourceId);

    return newReport;
  }

  async getReportReasons() {
    return await ReportRepository.getActiveReasons();
  }

  async getReportById(reportId: number) {
    const report = await ReportRepository.findUnique(reportId);
    if (!report) throw new ReportNotFoundError(reportId);
    return report;
  }

  async getReportStats() {
    return await ReportRepository.getStats();
  }

  async updateReportStatus(reportId: number, data: UpdateStatusData) {
    await this.reportExists(reportId);
    const report = await ReportRepository.updateStatus(reportId, data);
    const enrichedReport = ReportEnricher.enrichReport(report);
    return enrichedReport;
  }

  async deleteReport(reportId: number) {
    await this.reportExists(reportId);
    return await ReportRepository.delete(reportId);
  }

  async toggleVisibility(
    resourceType: string,
    resourceId: string | number,
    hidden: boolean,
  ) {
    if (resourceType === "post") {
      await postService.validate.verifyPostExists(resourceId as string);
      await ReportRepository.updatePostHidden(resourceId as string, hidden);
    } else {
      await commentService.validate.commentExists(resourceId as number);
      await ReportRepository.updateCommentHidden(resourceId as number, hidden);
    }
  }
}

const reportService = new ReportService();
export { ReportService, reportService };
