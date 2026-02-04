import { createLogger } from "../../core/config/logger";
import ChatService from "../../features/chat/service/ChatService";
import createActionLogger from "../../utils/logger.util";
import { createPaginationSchema } from "../../utils/pagination.util";

import type { AuthenticatedRequest } from "../../types/AuthRequest";
import type { NextFunction, Request, Response } from "express";

const controllerLogger = createLogger({ module: "ChatGroupController" });

const discoverGroups = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "discoverGroups",
    req,
  );

  try {
    actionLogger.info("Discovering public chat groups");

    const { user } = req as AuthenticatedRequest;

    const discoveryPaginationSchema = createPaginationSchema(10, 50, "uuid");
    const { limit, cursor } = discoveryPaginationSchema.parse(req.query);

    const result = await ChatService.discoverGroups(user.id, {
      limit,
      cursor: cursor as string | undefined,
    });

    actionLogger.info(
      {
        count: result.data.length,
        hasMore: result.pagination.hasMore,
        nextCursor: result.pagination.nextCursor,
      },
      "Public groups discovered successfully",
    );

    return res.status(200).json(result);
  } catch (error: unknown) {
    return next(error);
  }
};

const getRecommendedGroups = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "getSuggestedGroups",
    req,
  );
  try {
    actionLogger.info("Fetching suggested chat groups for user");

    const { user } = req as AuthenticatedRequest;
    const suggestionPaginationSchema = createPaginationSchema(5, 20, "uuid");
    const { limit, cursor } = suggestionPaginationSchema.parse(req.query);

    const result = await ChatService.getRecommendedGroups(user.id, {
      limit,
      cursor: cursor as string | undefined,
    });

    actionLogger.info(
      {
        count: result.data.length,
        hasMore: result.pagination.hasMore,
        nextCursor: result.pagination.nextCursor,
      },
      "Suggested groups fetched successfully",
    );

    return res.status(200).json(result);
  } catch (error: unknown) {
    return next(error);
  }
};

export { discoverGroups, getRecommendedGroups };
