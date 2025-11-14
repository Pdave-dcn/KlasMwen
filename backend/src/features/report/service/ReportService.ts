import { ReportNotFoundError } from "../../../core/error/custom/report.error.js";
import { assertPermission } from "../../../core/security/rbac.js";
import CommentService from "../../comments/service/CommentService.js";
import PostService from "../../posts/service/PostService.js";
import { autoHideContent } from "../helpers/autoHideContent.js";

import ReportEnricher from "./reportEnricher.js";
import ReportRepository from "./reportRepository.js";

import type { CreateReportData, UpdateStatusData } from "./reportTypes.js";
import type { ReportStatus } from "@prisma/client";

/**
 * Service layer for managing content reports and moderation actions.
 * Handles business logic for creating, retrieving, updating, and deleting reports.
 */
class ReportService {
  /**
   * Validates that a report exists in the database.
   * @throws {ReportNotFoundError} If the report does not exist
   */
  private static async reportExists(reportId: number) {
    const report = await ReportRepository.findUnique(reportId);

    if (!report) throw new ReportNotFoundError(reportId);

    return !!report;
  }

  /**
   * Validates that the reported content (post or comment) exists.
   * @throws {PostNotFoundError} If the post does not exist
   * @throws {CommentNotFoundError} If the comment does not exist
   * @throws {Error} If the content type is not supported
   */
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

  /**
   * Creates a new report for a post or comment.
   * Validates that the reported content exists and triggers auto-hide logic
   * if the content has accumulated enough reports.
   * @throws {PostNotFoundError} If the reported post does not exist
   * @throws {CommentNotFoundError} If the reported comment does not exist
   */
  static async createReport(user: Express.User, data: CreateReportData) {
    const resourceType = data.postId ? "post" : "comment";

    let resourceId: number | string;
    if (data.postId) {
      resourceId = data.postId;
    } else {
      resourceId = data.commentId as number;
    }

    const resource = await this.contentExists(resourceType, resourceId);
    if (!resource) return;

    assertPermission(
      user,
      data.postId ? "posts" : "comments",
      "report",
      resource
    );

    const newReport = await ReportRepository.create(data);
    void autoHideContent({ resourceType, resourceId });

    return newReport;
  }

  /**
   * Retrieves all active report reasons available for users to select when reporting content.
   * @returns Array of active report reasons with their IDs, labels, and descriptions
   */
  static async getReportReasons() {
    return await ReportRepository.getActiveReasons();
  }

  /**
   * Retrieves all reports with optional filtering and pagination.
   * Returns paginated results with metadata including total count and page information.
   * @param filters - Optional filters to narrow down results (status, postId, commentId)
   * @param pagination - Optional pagination parameters (page number and limit per page)
   * @returns Object containing report data array and pagination metadata
   */
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

  /**
   * Retrieves a single report by its unique identifier.
   * @throws {ReportNotFoundError} If the report does not exist
   */
  static async getReportById(reportId: number) {
    const report = await ReportRepository.findUnique(reportId);
    if (!report) throw new ReportNotFoundError(reportId);

    return report;
  }

  /**
   * Updates the status of an existing report.
   * @throws {ReportNotFoundError} If the report does not exist
   */
  static async updateReportStatus(reportId: number, data: UpdateStatusData) {
    await this.reportExists(reportId);
    return await ReportRepository.updateStatus(reportId, data);
  }

  /**
   * Permanently deletes a report from the system.
   * This action cannot be undone.
   * @throws {ReportNotFoundError} If the report does not exist
   */
  static async deleteReport(reportId: number) {
    await this.reportExists(reportId);
    return await ReportRepository.delete(reportId);
  }
}

export default ReportService;
