import { ReportNotFoundError } from "../../../core/error/custom/report.error.js";
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

  static async createReport(data: CreateReportData) {
    const newReport = await ReportRepository.create(data);

    const resourceType = data.postId ? "post" : "comment";

    let resourceId: number | string;
    if (data.postId) {
      resourceId = data.postId;
    } else {
      resourceId = data.commentId as number;
    }

    void autoHideContent({ resourceType, resourceId });

    return newReport;
  }

  static async getReportReasons() {
    return await ReportRepository.getActiveReasons();
  }

  static async getAllReports(filters?: {
    status?: ReportStatus;
    postId?: string;
    commentId?: number;
  }) {
    return await ReportRepository.findAll(filters);
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
