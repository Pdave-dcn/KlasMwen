import { ReportNotFoundError } from "../../../core/error/custom/report.error.js";
import CommentService from "../../comments/service/CommentService.js";
import PostService from "../../posts/service/PostService.js";
import { autoHideContent } from "../helpers/autoHideContent.js";

import ReportRepository from "./reportRepository.js";

import type { CreateReportData, UpdateStatusData } from "./reportTypes.js";
import type { ReportStatus } from "@prisma/client";

class ReportService {
  private static async reportExists(reportId: number) {
    const report = await ReportRepository.findUnique(reportId);

    if (!report) throw new ReportNotFoundError(reportId);

    return !!report;
  }

  private static async contentExists(
    contentType: string,
    contentId: string | number
  ) {
    if (contentType === "post") {
      return await PostService.postExists(contentId as string);
    } else if (contentType === "comment") {
      return await CommentService.commentExists(contentId as number);
    }

    throw new Error("Unsupported content");
  }

  static async createReport(data: CreateReportData) {
    const resourceType = data.postId ? "post" : "comment";

    let resourceId: number | string;
    if (data.postId) {
      resourceId = data.postId;
    } else {
      resourceId = data.commentId as number;
    }

    await this.contentExists(resourceType, resourceId);

    const newReport = await ReportRepository.create(data);
    void autoHideContent({ resourceType, resourceId });

    return newReport;
  }

  static async getReportReasons() {
    return await ReportRepository.getActiveReasons();
  }

  static async getAllReports(
    filters?: {
      status?: ReportStatus;
      postId?: string;
      commentId?: number;
    },
    pagination?: {
      page: number;
      limit: number;
    }
  ) {
    const [reports, total] = await Promise.all([
      ReportRepository.findAll(filters, pagination),
      ReportRepository.count(filters),
    ]);

    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 10;
    const totalPages = Math.ceil(total / limit);

    return {
      data: reports,
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

  static async getReportById(reportId: number) {
    const report = await ReportRepository.findUnique(reportId);
    if (!report) throw new ReportNotFoundError(reportId);

    return report;
  }

  static async updateReportStatus(reportId: number, data: UpdateStatusData) {
    await this.reportExists(reportId);
    return await ReportRepository.updateStatus(reportId, data);
  }

  static async deleteReport(reportId: number) {
    await this.reportExists(reportId);
    return await ReportRepository.delete(reportId);
  }
}

export default ReportService;
