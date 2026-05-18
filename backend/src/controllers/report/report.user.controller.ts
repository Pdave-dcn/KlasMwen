import { createLogger } from "../../core/config/logger.js";
import { reportService } from "../../features/report/service/index.js";
import { withLogging } from "../../utils/logger.util.js";
import { ReportCreationDataSchema } from "../../zodSchemas/report.zod.js";

import type { AuthenticatedRequest } from "../../types/AuthRequest.js";

const controllerLogger = createLogger({ module: "ReportController" });

const createReport = withLogging<AuthenticatedRequest>(
  controllerLogger,
  "createReport",
  async ({ req, res, log }) => {
    log.info("Report creation attempt started");

    const { user } = req;
    const validatedData = ReportCreationDataSchema.parse(req.body);
    const newReport = await reportService.createReport(user, {
      ...validatedData,
      reporterId: user.id,
    });

    log.info(
      {
        reportReason: newReport.reason.label,
        reporter: newReport.reporter.username,
      },
      "Report created successfully",
    );

    res.status(201).json({ message: "Report successfully created" });
  },
);

export { createReport };
