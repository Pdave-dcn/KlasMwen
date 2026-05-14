import { createLogger } from "../../core/config/logger.js";
import CircleService from "../../features/circle/service/CircleService.js";
import createActionLogger from "../../utils/logger.util.js";

import type { AuthenticatedRequest } from "../../types/AuthRequest.js";
import type { NextFunction, Request, Response } from "express";

const controllerLogger = createLogger({ module: "CircleStatsController" });

export const getQuickStats = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "getQuickStats",
    req,
  );

  try {
    actionLogger.info("Fetching quick chat statistics");
    const { user } = req as AuthenticatedRequest;

    const quickStats = await CircleService.getQuickStats(user.id);

    actionLogger.info(
      { quickStats },
      "Quick chat statistics fetched successfully",
    );

    return res.status(200).json({
      data: quickStats,
    });
  } catch (error: unknown) {
    return next(error);
  }
};
