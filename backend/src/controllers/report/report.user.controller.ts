import { createLogger } from "../../core/config/logger.js";
import ReportService from "../../features/report/service/ReportService.js";
import createActionLogger from "../../utils/logger.util.js";
import { ReportCreationDataSchema } from "../../zodSchemas/report.zod.js";

import type { AuthenticatedRequest } from "../../types/AuthRequest.js";
import type { Request, Response, NextFunction } from "express";

const controllerLogger = createLogger({ module: "ReportController" });

export const createReport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "createReport",
    req
  );

  try {
    actionLogger.info("Report creation attempt started");
    const startTime = Date.now();

    const { user } = req as AuthenticatedRequest;
    const validatedData = ReportCreationDataSchema.parse(req.body);

    actionLogger.debug("Processing report creation");
    const serviceStarttime = Date.now();
    const newReport = await ReportService.createReport(user, {
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
    return next(error);
  }
};
