import { ReportNotFoundError } from "../../../core/error/custom/report.error";

import ReportRepository from "./reportRepository";

import type { CreateReportData } from "./reportTypes";
import type { ReportStatus } from "@prisma/client";

class ReportService {
  private static async reportExists(reportId: number) {
    const report = await ReportRepository.findUnique(reportId);

    if (!report) throw new ReportNotFoundError(reportId);

    return !!report;
  }

  static async createReport(data: CreateReportData) {
    return await ReportRepository.create(data);
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

  static async updateReportStatus(reportId: number, status: ReportStatus) {
    await this.reportExists(reportId);
    return await ReportRepository.updateStatus(reportId, status);
  }

  static async deleteReport(reportId: number) {
    await this.reportExists(reportId);
    return await ReportRepository.delete(reportId);
  }
}

export default ReportService;
