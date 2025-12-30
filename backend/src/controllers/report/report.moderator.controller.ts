import prisma from "../../core/config/db.js";
import { createLogger } from "../../core/config/logger.js";
import CommentService from "../../features/comments/service/CommentService.js";
import { PostService } from "../../features/posts/service/PostService.js";
import ReportService from "../../features/report/service/ReportService.js";
import createActionLogger from "../../utils/logger.util.js";
import {
  ReportIdParamSchema,
  ReportQuerySchema,
  ReportStatusUpdateSchema,
  ToggleVisibilitySchema,
} from "../../zodSchemas/report.zod.js";

import type { Request, Response, NextFunction } from "express";

const controllerLogger = createLogger({ module: "ReportController" });

const getAllReports = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "getAllReports",
    req
  );

  try {
    actionLogger.info("Fetching all reports");
    const startTime = Date.now();

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

    actionLogger.debug("Processing reports fetching with filters");
    const serviceStarttime = Date.now();
    const result = await ReportService.getAllReports(filters, pagination);
    const serviceDuration = Date.now() - serviceStarttime;

    const totalDuration = Date.now() - startTime;

    actionLogger.info(
      {
        count: result.data.length,
        total: result.pagination.total,
        page: result.pagination.page,
        filters,
        serviceDuration,
        totalDuration,
      },
      "Reports fetched successfully"
    );

    return res.status(200).json(result);
  } catch (error: unknown) {
    return next(error);
  }
};

const getReportById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "getReportById",
    req
  );

  try {
    actionLogger.info("Fetching report by ID");
    const startTime = Date.now();

    const { id: reportId } = ReportIdParamSchema.parse(req.params);

    actionLogger.debug("Processing report fetch");
    const serviceStarttime = Date.now();
    const report = await ReportService.getReportById(reportId);
    const serviceDuration = Date.now() - serviceStarttime;

    const totalDuration = Date.now() - startTime;

    actionLogger.info(
      {
        reportId,
        serviceDuration,
        totalDuration,
      },
      "Report fetched successfully"
    );

    return res.status(200).json({ data: report });
  } catch (error: unknown) {
    return next(error);
  }
};

const updateReportStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "updateReportStatus",
    req
  );

  try {
    actionLogger.info("Report status update attempt started");
    const startTime = Date.now();

    const { id: reportId } = ReportIdParamSchema.parse(req.params);
    const validatedData = ReportStatusUpdateSchema.parse(req.body);

    actionLogger.debug("Processing report status update");
    const serviceStarttime = Date.now();
    const updatedReport = await ReportService.updateReportStatus(
      reportId,
      validatedData
    );
    const serviceDuration = Date.now() - serviceStarttime;

    const totalDuration = Date.now() - startTime;

    actionLogger.info(
      {
        reportId,
        newStatus: updatedReport.status,
        serviceDuration,
        totalDuration,
      },
      "Report status updated successfully"
    );

    return res.status(200).json({
      message: "Report status updated successfully",
      data: updatedReport,
    });
  } catch (error: unknown) {
    return next(error);
  }
};

const deleteReport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "deleteReport",
    req
  );

  try {
    actionLogger.info("Report deletion attempt started");
    const startTime = Date.now();

    const { id: reportId } = ReportIdParamSchema.parse(req.params);

    actionLogger.debug("Processing report deletion");
    const serviceStarttime = Date.now();
    const deletedReport = await ReportService.deleteReport(reportId);
    const serviceDuration = Date.now() - serviceStarttime;

    const totalDuration = Date.now() - startTime;

    actionLogger.info(
      {
        reportId,
        deletedReportReason: deletedReport.reason.label,
        serviceDuration,
        totalDuration,
      },
      "Report deleted successfully"
    );

    return res.status(200).json({
      message: "Report deleted successfully",
    });
  } catch (error: unknown) {
    return next(error);
  }
};

const toggleVisibility = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "toggleVisibility",
    req
  );

  try {
    actionLogger.info("Moderator requested visibility toggle");
    const startTime = Date.now();

    const { resourceType, resourceId, hidden } = ToggleVisibilitySchema.parse(
      req.body
    );

    actionLogger.debug("Starting database operation");
    if (resourceType === "post") {
      await PostService.verifyPostExists(resourceId as string);
      await prisma.post.update({
        where: { id: resourceId as string },
        data: { hidden },
      });
    } else {
      await CommentService.commentExists(resourceId as number);
      await prisma.comment.update({
        where: { id: resourceId as number },
        data: { hidden },
      });
    }

    const totalDuration = Date.now() - startTime;

    actionLogger.info(
      { totalDuration },
      `Resource (${resourceType}) ${resourceId} hidden=${hidden}`
    );

    return res.status(200).json({
      message: `Successfully ${hidden ? "hid" : "unhid"} ${resourceType}`,
    });
  } catch (error) {
    return next(error);
  }
};

const getReportStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "getReportStats",
    req
  );

  try {
    actionLogger.info("Fetching report statistics");
    const startTime = Date.now();

    actionLogger.debug("Processing report stats fetching");
    const serviceStarttime = Date.now();
    const stats = await ReportService.getReportStats();
    const serviceDuration = Date.now() - serviceStarttime;

    const totalDuration = Date.now() - startTime;

    actionLogger.info(
      {
        stats,
        serviceDuration,
        totalDuration,
      },
      "Report statistics fetched successfully"
    );

    return res.status(200).json({ data: stats });
  } catch (error: unknown) {
    return next(error);
  }
};

export {
  getAllReports,
  getReportById,
  updateReportStatus,
  deleteReport,
  toggleVisibility,
  getReportStats,
};
