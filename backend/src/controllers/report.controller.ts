import prisma from "../core/config/db.js";
import { createLogger } from "../core/config/logger.js";
import { handleError } from "../core/error/index.js";
import CommentService from "../features/comments/service/CommentService.js";
import PostService from "../features/posts/service/PostService.js";
import ReportService from "../features/report/service/ReportService.js";
import { checkAdminAuth, ensureAuthenticated } from "../utils/auth.util.js";
import createActionLogger from "../utils/logger.util.js";
import {
  ReportCreationDataSchema,
  ReportIdParamSchema,
  ReportQuerySchema,
  ReportStatusUpdateSchema,
  ToggleVisibilitySchema,
} from "../zodSchemas/report.zod.js";

import type { Request, Response } from "express";

const controllerLogger = createLogger({ module: "ReportController" });

const createReport = async (req: Request, res: Response) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "createReport",
    req
  );

  try {
    actionLogger.info("Report creation attempt started");
    const startTime = Date.now();

    const user = ensureAuthenticated(req);
    const validatedData = ReportCreationDataSchema.parse(req.body);
    actionLogger.info("User authenticated and report data validated");

    actionLogger.debug("Processing report creation");
    const serviceStarttime = Date.now();
    const newReport = await ReportService.createReport({
      ...validatedData,
      reporterId: user.id,
    });
    if (!newReport) return;
    const serviceDuration = Date.now() - serviceStarttime;

    const totalDuration = Date.now() - startTime;

    actionLogger.info(
      {
        reportReason: newReport.reason.label,
        reporter: newReport.reporter.username,
        serviceDuration,
        totalDuration,
      },
      "Report created successfully"
    );

    return res.status(201).json({ message: "Report successfully created" });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

const getReportReasons = async (req: Request, res: Response) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "getReportReasons",
    req
  );
  try {
    actionLogger.info("Fetching report reasons");
    const startTime = Date.now();

    actionLogger.debug("Processing report reasons fetching");
    const serviceStarttime = Date.now();
    const reportReasons = await ReportService.getReportReasons();
    if (!reportReasons) return;
    const serviceDuration = Date.now() - serviceStarttime;

    const totalDuration = Date.now() - startTime;

    actionLogger.info(
      {
        count: reportReasons.length,
        serviceDuration,
        totalDuration,
      },
      "Report reasons fetched successfully"
    );

    return res.status(200).json({ data: reportReasons });
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

const getAllReports = async (req: Request, res: Response) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "getAllReports",
    req
  );

  try {
    actionLogger.info("Fetching all reports");
    const startTime = Date.now();

    checkAdminAuth(req.user);

    const validatedQuery = ReportQuerySchema.parse(req.query);

    const filters = {
      status: validatedQuery.status,
      postId: validatedQuery.postId,
      commentId: validatedQuery.commentId,
    };

    const pagination = {
      page: validatedQuery.page,
      limit: validatedQuery.limit,
    };

    actionLogger.info("User authorized and filters extracted");

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
    return handleError(error, res);
  }
};

const getReportById = async (req: Request, res: Response) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "getReportById",
    req
  );

  try {
    actionLogger.info("Fetching report by ID");
    const startTime = Date.now();

    checkAdminAuth(req.user);
    const { id: reportId } = ReportIdParamSchema.parse(req.params);
    actionLogger.info("User authorized and report ID parsed");

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
    return handleError(error, res);
  }
};

const updateReportStatus = async (req: Request, res: Response) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "updateReportStatus",
    req
  );

  try {
    actionLogger.info("Report status update attempt started");
    const startTime = Date.now();

    checkAdminAuth(req.user);
    const { id: reportId } = ReportIdParamSchema.parse(req.params);
    const validatedData = ReportStatusUpdateSchema.parse(req.body);
    actionLogger.info("User authorized, report ID and data validated");

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
    return handleError(error, res);
  }
};

const deleteReport = async (req: Request, res: Response) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "deleteReport",
    req
  );

  try {
    actionLogger.info("Report deletion attempt started");
    const startTime = Date.now();

    checkAdminAuth(req.user);
    const { id: reportId } = ReportIdParamSchema.parse(req.params);
    actionLogger.info("User authorized and report ID parsed");

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
    return handleError(error, res);
  }
};

const toggleVisibility = async (req: Request, res: Response) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "toggleVisibility",
    req
  );

  try {
    actionLogger.info("Moderator requested visibility toggle");
    const startTime = Date.now();

    checkAdminAuth(req.user);
    const { resourceType, resourceId, hidden } = ToggleVisibilitySchema.parse(
      req.body
    );
    actionLogger.info("User authorized and data validated");

    actionLogger.debug("Starting database operation");
    if (resourceType === "post") {
      await PostService.postExists(resourceId as string);
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
    return handleError(error, res);
  }
};

export {
  createReport,
  getReportReasons,
  getAllReports,
  getReportById,
  updateReportStatus,
  deleteReport,
  toggleVisibility,
};
