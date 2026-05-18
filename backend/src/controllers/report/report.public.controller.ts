import { createLogger } from "../../core/config/logger.js";
import { reportService } from "../../features/report/service/index.js";
import { withLogging } from "../../utils/logger.util.js";

import type { Request } from "express";

const controllerLogger = createLogger({ module: "ReportController" });

const getReportReasons = withLogging<Request>(
  controllerLogger,
  "getReportReasons",
  async ({ res, log }) => {
    log.info("Fetching report reasons");

    const reportReasons = await reportService.getReportReasons();

    log.info(
      { count: reportReasons.length },
      "Report reasons fetched successfully",
    );

    res.status(200).json({ data: reportReasons });
  },
);

export { getReportReasons };
