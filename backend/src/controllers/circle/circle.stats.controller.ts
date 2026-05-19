import { createLogger } from "../../core/config/logger.js";
import { circleService } from "../../features/circle/service/CircleService.js";
import { withLogging } from "../../utils/logger.util.js";

import type { AuthenticatedRequest } from "../../types/AuthRequest.js";

const controllerLogger = createLogger({ module: "CircleStatsController" });

export const getQuickStats = withLogging<AuthenticatedRequest>(
  controllerLogger,
  "getQuickStats",
  async ({ req, res, log }) => {
    log.info("Fetching quick chat statistics");

    const quickStats = await circleService.getQuickStats(req.user.id);

    log.info(
      { quickStats },
      "Quick chat statistics fetched successfully",
    );

    res.status(200).json({
      data: quickStats,
    });
  },
);
