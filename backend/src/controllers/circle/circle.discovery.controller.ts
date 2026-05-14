import { createLogger } from "../../core/config/logger.js";
import CircleService from "../../features/circle/service/CircleService.js";
import createActionLogger from "../../utils/logger.util.js";
import { createPaginationSchema } from "../../utils/pagination.util.js";
import {
  StudyCircleIdParamSchema,
  CreatorIdParamSchema,
  CircleSearchFiltersSchema,
  SearchSuggestionQuerySchema,
  SmallCirclesQuerySchema,
  TrendingQuerySchema,
} from "../../zodSchemas/circle.zod.js";

import type { AuthenticatedRequest } from "../../types/AuthRequest.js";
import type { NextFunction, Request, Response } from "express";

const controllerLogger = createLogger({
  module: "StudyCircleSearchController",
});

const discoverCircles = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "discoverCircles",
    req,
  );

  try {
    actionLogger.info("Discovering public study circles");

    const { user } = req as AuthenticatedRequest;

    const discoveryPaginationSchema = createPaginationSchema(10, 50, "uuid");
    const { limit, cursor } = discoveryPaginationSchema.parse(req.query);

    const result = await CircleService.discoverCircles(user.id, {
      limit,
      cursor: cursor as string | undefined,
    });

    actionLogger.info(
      {
        count: result.data.length,
        hasMore: result.pagination.hasMore,
        nextCursor: result.pagination.nextCursor,
      },
      "Public circles discovered successfully",
    );

    return res.status(200).json(result);
  } catch (error: unknown) {
    return next(error);
  }
};

const getRecommendedCircles = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "getRecommendedCircles",
    req,
  );
  try {
    actionLogger.info("Fetching recommended study circles for user");

    const { user } = req as AuthenticatedRequest;
    const suggestionPaginationSchema = createPaginationSchema(5, 20, "uuid");
    const { limit, cursor } = suggestionPaginationSchema.parse(req.query);

    const result = await CircleService.getRecommendedCircles(user.id, {
      limit,
      cursor: cursor as string | undefined,
    });

    actionLogger.info(
      {
        count: result.data.length,
        hasMore: result.pagination.hasMore,
        nextCursor: result.pagination.nextCursor,
      },
      "Recommended circles fetched successfully",
    );

    return res.status(200).json(result);
  } catch (error: unknown) {
    return next(error);
  }
};

const getTrendingCircles = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "getTrendingCircles",
    req,
  );

  try {
    actionLogger.info("Fetching trending study circles");

    const { user } = req as AuthenticatedRequest;

    const trendingPaginationSchema = createPaginationSchema(10, 50, "uuid");
    const { limit, cursor } = trendingPaginationSchema.parse(req.query);
    const { timeframe } = TrendingQuerySchema.parse(req.query);

    const result = await CircleService.getTrendingCircles(
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
      "Trending circles fetched successfully",
    );

    return res.status(200).json(result);
  } catch (error: unknown) {
    return next(error);
  }
};

const getNewCircles = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "getNewCircles",
    req,
  );

  try {
    actionLogger.info("Fetching newly created study circles");

    const { user } = req as AuthenticatedRequest;

    const newGroupsPaginationSchema = createPaginationSchema(10, 50, "uuid");
    const { limit, cursor } = newGroupsPaginationSchema.parse(req.query);

    const result = await CircleService.getNewCircles(user.id, {
      limit,
      cursor: cursor as string | undefined,
    });

    actionLogger.info(
      {
        count: result.data.length,
        hasMore: result.pagination.hasMore,
        nextCursor: result.pagination.nextCursor,
      },
      "New circles fetched successfully",
    );

    return res.status(200).json(result);
  } catch (error: unknown) {
    return next(error);
  }
};

const getSmallCircles = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "getSmallCircles",
    req,
  );

  try {
    actionLogger.info("Fetching small study circles");

    const { user } = req as AuthenticatedRequest;

    const smallGroupsPaginationSchema = createPaginationSchema(10, 50, "uuid");
    const { limit, cursor } = smallGroupsPaginationSchema.parse(req.query);
    const { maxMembers } = SmallCirclesQuerySchema.parse(req.query);

    const result = await CircleService.getSmallCircles(
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
      "Small circles fetched successfully",
    );

    return res.status(200).json(result);
  } catch (error: unknown) {
    return next(error);
  }
};

const getSimilarCircles = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "getSimilarCircles",
    req,
  );

  try {
    actionLogger.info("Fetching similar study circles");

    const { user } = req as AuthenticatedRequest;

    const { circleId } = StudyCircleIdParamSchema.parse(req.params);

    const similarPaginationSchema = createPaginationSchema(10, 50, "uuid");
    const { limit, cursor } = similarPaginationSchema.parse(req.query);

    const result = await CircleService.getSimilarCircles(user.id, circleId, {
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
      "Similar circles fetched successfully",
    );

    return res.status(200).json(result);
  } catch (error: unknown) {
    return next(error);
  }
};

const getCirclesByCreator = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "getCirclesByCreator",
    req,
  );

  try {
    actionLogger.info("Fetching circles by creator");

    const { user } = req as AuthenticatedRequest;

    const { creatorId } = CreatorIdParamSchema.parse(req.params);

    const creatorPaginationSchema = createPaginationSchema(10, 50, "uuid");
    const { limit, cursor } = creatorPaginationSchema.parse(req.query);

    const result = await CircleService.getCirclesByCreator(user.id, creatorId, {
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
      "Circles by creator fetched successfully",
    );

    return res.status(200).json(result);
  } catch (error: unknown) {
    return next(error);
  }
};

const searchCircles = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "searchCircles",
    req,
  );

  try {
    actionLogger.info("Searching study circles");

    const { user } = req as AuthenticatedRequest;

    const filters = CircleSearchFiltersSchema.parse(req.query);

    const sanitizedSearchTerm = filters.query
      ? filters.query.replace(/[%_]/g, "\\$&")
      : undefined;

    const searchPaginationSchema = createPaginationSchema(10, 50, "uuid");
    const { limit, cursor } = searchPaginationSchema.parse(req.query);

    const result = await CircleService.searchCircles(
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
      "Circles search completed successfully",
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

    const result = await CircleService.getSearchSuggestions(query, limit);

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
  discoverCircles,
  getRecommendedCircles,
  getTrendingCircles,
  getNewCircles,
  getSmallCircles,
  getSimilarCircles,
  getCirclesByCreator,
  searchCircles,
  getSearchSuggestions,
};
