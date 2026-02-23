import { createLogger } from "../../core/config/logger";
import ChatService from "../../features/chat/service/ChatService";
import createActionLogger from "../../utils/logger.util";
import { createPaginationSchema } from "../../utils/pagination.util";
import {
  StudyCircleIdParamSchema,
  CreatorIdParamSchema,
  GroupSearchFiltersSchema,
  SearchSuggestionQuerySchema,
  SmallGroupsQuerySchema,
  TrendingQuerySchema,
} from "../../zodSchemas/chat.zod";

import type { AuthenticatedRequest } from "../../types/AuthRequest";
import type { NextFunction, Request, Response } from "express";

const controllerLogger = createLogger({ module: "ChatSearchController" });

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
    "getRecommendedGroups",
    req,
  );
  try {
    actionLogger.info("Fetching recommended chat groups for user");

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
      "Recommended groups fetched successfully",
    );

    return res.status(200).json(result);
  } catch (error: unknown) {
    return next(error);
  }
};

const getTrendingGroups = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "getTrendingGroups",
    req,
  );

  try {
    actionLogger.info("Fetching trending chat groups");

    const { user } = req as AuthenticatedRequest;

    const trendingPaginationSchema = createPaginationSchema(10, 50, "uuid");
    const { limit, cursor } = trendingPaginationSchema.parse(req.query);
    const { timeframe } = TrendingQuerySchema.parse(req.query);

    const result = await ChatService.getTrendingGroups(
      user.id,
      {
        limit,
        cursor: cursor as string | undefined,
      },
      timeframe,
    );

    actionLogger.info(
      {
        count: result.data.length,
        hasMore: result.pagination.hasMore,
        nextCursor: result.pagination.nextCursor,
        timeframe,
      },
      "Trending groups fetched successfully",
    );

    return res.status(200).json(result);
  } catch (error: unknown) {
    return next(error);
  }
};

const getNewGroups = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "getNewGroups",
    req,
  );

  try {
    actionLogger.info("Fetching newly created chat groups");

    const { user } = req as AuthenticatedRequest;

    const newGroupsPaginationSchema = createPaginationSchema(10, 50, "uuid");
    const { limit, cursor } = newGroupsPaginationSchema.parse(req.query);

    const result = await ChatService.getNewGroups(user.id, {
      limit,
      cursor: cursor as string | undefined,
    });

    actionLogger.info(
      {
        count: result.data.length,
        hasMore: result.pagination.hasMore,
        nextCursor: result.pagination.nextCursor,
      },
      "New groups fetched successfully",
    );

    return res.status(200).json(result);
  } catch (error: unknown) {
    return next(error);
  }
};

const getSmallGroups = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "getSmallGroups",
    req,
  );

  try {
    actionLogger.info("Fetching small chat groups");

    const { user } = req as AuthenticatedRequest;

    const smallGroupsPaginationSchema = createPaginationSchema(10, 50, "uuid");
    const { limit, cursor } = smallGroupsPaginationSchema.parse(req.query);
    const { maxMembers } = SmallGroupsQuerySchema.parse(req.query);

    const result = await ChatService.getSmallGroups(
      user.id,
      {
        limit,
        cursor: cursor as string | undefined,
      },
      maxMembers,
    );

    actionLogger.info(
      {
        count: result.data.length,
        hasMore: result.pagination.hasMore,
        nextCursor: result.pagination.nextCursor,
        maxMembers,
      },
      "Small groups fetched successfully",
    );

    return res.status(200).json(result);
  } catch (error: unknown) {
    return next(error);
  }
};

const getSimilarGroups = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "getSimilarGroups",
    req,
  );

  try {
    actionLogger.info("Fetching similar chat groups");

    const { user } = req as AuthenticatedRequest;

    const { circleId } = StudyCircleIdParamSchema.parse(req.params);

    const similarPaginationSchema = createPaginationSchema(10, 50, "uuid");
    const { limit, cursor } = similarPaginationSchema.parse(req.query);

    const result = await ChatService.getSimilarGroups(user.id, circleId, {
      limit,
      cursor: cursor as string | undefined,
    });

    actionLogger.info(
      {
        count: result.data.length,
        hasMore: result.pagination.hasMore,
        nextCursor: result.pagination.nextCursor,
        referenceGroupId: circleId,
      },
      "Similar groups fetched successfully",
    );

    return res.status(200).json(result);
  } catch (error: unknown) {
    return next(error);
  }
};

const getGroupsByCreator = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "getGroupsByCreator",
    req,
  );

  try {
    actionLogger.info("Fetching groups by creator");

    const { user } = req as AuthenticatedRequest;

    const { creatorId } = CreatorIdParamSchema.parse(req.params);

    const creatorPaginationSchema = createPaginationSchema(10, 50, "uuid");
    const { limit, cursor } = creatorPaginationSchema.parse(req.query);

    const result = await ChatService.getGroupsByCreator(user.id, creatorId, {
      limit,
      cursor: cursor as string | undefined,
    });

    actionLogger.info(
      {
        count: result.data.length,
        hasMore: result.pagination.hasMore,
        nextCursor: result.pagination.nextCursor,
        creatorId,
      },
      "Groups by creator fetched successfully",
    );

    return res.status(200).json(result);
  } catch (error: unknown) {
    return next(error);
  }
};

const searchGroups = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "searchGroups",
    req,
  );

  try {
    actionLogger.info("Searching chat groups");

    const { user } = req as AuthenticatedRequest;

    const filters = GroupSearchFiltersSchema.parse(req.query);

    const sanitizedSearchTerm = filters.query
      ? filters.query.replace(/[%_]/g, "\\$&")
      : undefined;

    const searchPaginationSchema = createPaginationSchema(10, 50, "uuid");
    const { limit, cursor } = searchPaginationSchema.parse(req.query);

    const result = await ChatService.searchGroups(
      user.id,
      { ...filters, query: sanitizedSearchTerm },
      {
        limit,
        cursor: cursor as string | undefined,
      },
    );

    actionLogger.info(
      {
        count: result.data.length,
        hasMore: result.pagination.hasMore,
        nextCursor: result.pagination.nextCursor,
        filters,
      },
      "Groups search completed successfully",
    );

    return res.status(200).json(result);
  } catch (error: unknown) {
    return next(error);
  }
};

const getSearchSuggestions = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "getSearchSuggestions",
    req,
  );

  try {
    actionLogger.info("Fetching search suggestions");

    const { query, limit } = SearchSuggestionQuerySchema.parse(req.query);

    const result = await ChatService.getSearchSuggestions(query, limit);

    actionLogger.info(
      {
        count: result.length,
        query,
      },
      "Search suggestions fetched successfully",
    );

    return res.status(200).json({ data: result });
  } catch (error: unknown) {
    return next(error);
  }
};

export {
  discoverGroups,
  getRecommendedGroups,
  getTrendingGroups,
  getNewGroups,
  getSmallGroups,
  getSimilarGroups,
  getGroupsByCreator,
  searchGroups,
  getSearchSuggestions,
};
