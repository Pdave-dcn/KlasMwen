import { createLogger } from "../../core/config/logger.js";
import { handleError } from "../../core/error/index.js";
import ReportService from "../../features/report/service/ReportService.js";
import createActionLogger from "../../utils/logger.util.js";

import type { Request, Response } from "express";

const controllerLogger = createLogger({ module: "ReportController" });

export const getReportReasons = async (req: Request, res: Response) => {
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
