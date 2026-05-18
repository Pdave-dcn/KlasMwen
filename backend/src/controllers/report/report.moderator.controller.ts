import { createLogger } from "../../core/config/logger.js";
import { reportService } from "../../features/report/service/index.js";
import { withLogging } from "../../utils/logger.util.js";
import {
  ReportIdParamSchema,
  ReportQuerySchema,
  ReportStatusUpdateSchema,
  ToggleVisibilitySchema,
} from "../../zodSchemas/report.zod.js";

import type { AuthenticatedRequest } from "../../types/AuthRequest.js";

const controllerLogger = createLogger({ module: "ReportController" });

const getAllReports = withLogging<AuthenticatedRequest>(
  controllerLogger,
  "getAllReports",
  async ({ req, res, log }) => {
    log.info("Fetching all reports");

    const validatedQuery = ReportQuerySchema.parse(req.query);

    const filters = {
      status: validatedQuery.status,
      reasonId: validatedQuery.reasonId,
      postId: validatedQuery.postId,
      commentId: validatedQuery.commentId,
      dateFrom: validatedQuery.dateFrom,
      dateTo: validatedQuery.dateTo,
      resourceType: validatedQuery.resourceType,
    };

    const pagination = {
      page: validatedQuery.page,
      limit: validatedQuery.limit,
    };

    const result = await reportService.getAllReports(filters, pagination);

    log.info(
      {
        count: result.data.length,
        total: result.pagination.total,
        page: result.pagination.page,
        filters,
      },
      "Reports fetched successfully",
    );

    res.status(200).json(result);
  },
);

const getReportById = withLogging<AuthenticatedRequest>(
  controllerLogger,
  "getReportById",
  async ({ req, res, log }) => {
    log.info("Fetching report by ID");

    const { id: reportId } = ReportIdParamSchema.parse(req.params);
    const report = await reportService.getReportById(reportId);

    log.info({ reportId }, "Report fetched successfully");

    res.status(200).json({ data: report });
  },
);

const updateReportStatus = withLogging<AuthenticatedRequest>(
  controllerLogger,
  "updateReportStatus",
  async ({ req, res, log }) => {
    log.info("Report status update attempt started");

    const { id: reportId } = ReportIdParamSchema.parse(req.params);
    const validatedData = ReportStatusUpdateSchema.parse(req.body);
    const updatedReport = await reportService.updateReportStatus(
      reportId,
      validatedData,
    );

    log.info(
      { reportId, newStatus: updatedReport.status },
      "Report status updated successfully",
    );

    res.status(200).json({
      message: "Report status updated successfully",
      data: updatedReport,
    });
  },
);

const deleteReport = withLogging<AuthenticatedRequest>(
  controllerLogger,
  "deleteReport",
  async ({ req, res, log }) => {
    log.info("Report deletion attempt started");

    const { id: reportId } = ReportIdParamSchema.parse(req.params);
    await reportService.deleteReport(reportId);

    log.info({ reportId }, "Report deleted successfully");

    res.status(200).json({
      message: "Report deleted successfully",
    });
  },
);

const toggleVisibility = withLogging<AuthenticatedRequest>(
  controllerLogger,
  "toggleVisibility",
  async ({ req, res, log }) => {
    log.info("Moderator requested visibility toggle");

    const { resourceType, resourceId, hidden } = ToggleVisibilitySchema.parse(
      req.body,
    );

    await reportService.toggleVisibility(resourceType, resourceId, hidden);

    log.info(
      { resourceType, resourceId, hidden },
      `Resource (${resourceType}) ${resourceId} hidden=${hidden}`,
    );

    res.status(200).json({
      message: `Successfully ${hidden ? "hid" : "unhid"} ${resourceType}`,
    });
  },
);

const getReportStats = withLogging<AuthenticatedRequest>(
  controllerLogger,
  "getReportStats",
  async ({ req: _req, res, log }) => {
    log.info("Fetching report statistics");

    const stats = await reportService.getReportStats();

    log.info({ stats }, "Report statistics fetched successfully");

    res.status(200).json({ data: stats });
  },
);

export {
  getAllReports,
  getReportById,
  updateReportStatus,
  deleteReport,
  toggleVisibility,
  getReportStats,
};
