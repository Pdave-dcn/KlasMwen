import { createLogger } from "../../core/config/logger.js";
import { circleService } from "../../features/circle/service/CircleService.js";
import { withLogging } from "../../utils/logger.util.js";
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

const controllerLogger = createLogger({
  module: "StudyCircleSearchController",
});

const discoverCircles = withLogging<AuthenticatedRequest>(
  controllerLogger,
  "discoverCircles",
  async ({ req, res, log }) => {
    log.info("Discovering public study circles");

    const discoveryPaginationSchema = createPaginationSchema(10, 50, "uuid");
    const { limit, cursor } = discoveryPaginationSchema.parse(req.query);

    const result = await circleService.search.discoverCircles(req.user.id, {
      limit,
      cursor: cursor as string | undefined,
    });

    log.info(
      {
        count: result.data.length,
        hasMore: result.pagination.hasMore,
        nextCursor: result.pagination.nextCursor,
      },
      "Public circles discovered successfully",
    );

    res.status(200).json(result);
  },
);

const getRecommendedCircles = withLogging<AuthenticatedRequest>(
  controllerLogger,
  "getRecommendedCircles",
  async ({ req, res, log }) => {
    log.info("Fetching recommended study circles for user");

    const suggestionPaginationSchema = createPaginationSchema(5, 20, "uuid");
    const { limit, cursor } = suggestionPaginationSchema.parse(req.query);

    const result = await circleService.search.getRecommendedCircles(req.user.id, {
      limit,
      cursor: cursor as string | undefined,
    });

    log.info(
      {
        count: result.data.length,
        hasMore: result.pagination.hasMore,
        nextCursor: result.pagination.nextCursor,
      },
      "Recommended circles fetched successfully",
    );

    res.status(200).json(result);
  },
);

const getTrendingCircles = withLogging<AuthenticatedRequest>(
  controllerLogger,
  "getTrendingCircles",
  async ({ req, res, log }) => {
    log.info("Fetching trending study circles");

    const trendingPaginationSchema = createPaginationSchema(10, 50, "uuid");
    const { limit, cursor } = trendingPaginationSchema.parse(req.query);
    const { timeframe } = TrendingQuerySchema.parse(req.query);

    const result = await circleService.search.getTrendingCircles(
      req.user.id,
      {
        limit,
        cursor: cursor as string | undefined,
      },
      timeframe,
    );

    log.info(
      {
        count: result.data.length,
        hasMore: result.pagination.hasMore,
        nextCursor: result.pagination.nextCursor,
        timeframe,
      },
      "Trending circles fetched successfully",
    );

    res.status(200).json(result);
  },
);

const getNewCircles = withLogging<AuthenticatedRequest>(
  controllerLogger,
  "getNewCircles",
  async ({ req, res, log }) => {
    log.info("Fetching newly created study circles");

    const newGroupsPaginationSchema = createPaginationSchema(10, 50, "uuid");
    const { limit, cursor } = newGroupsPaginationSchema.parse(req.query);

    const result = await circleService.search.getNewCircles(req.user.id, {
      limit,
      cursor: cursor as string | undefined,
    });

    log.info(
      {
        count: result.data.length,
        hasMore: result.pagination.hasMore,
        nextCursor: result.pagination.nextCursor,
      },
      "New circles fetched successfully",
    );

    res.status(200).json(result);
  },
);

const getSmallCircles = withLogging<AuthenticatedRequest>(
  controllerLogger,
  "getSmallCircles",
  async ({ req, res, log }) => {
    log.info("Fetching small study circles");

    const smallGroupsPaginationSchema = createPaginationSchema(10, 50, "uuid");
    const { limit, cursor } = smallGroupsPaginationSchema.parse(req.query);
    const { maxMembers } = SmallCirclesQuerySchema.parse(req.query);

    const result = await circleService.search.getSmallCircles(
      req.user.id,
      {
        limit,
        cursor: cursor as string | undefined,
      },
      maxMembers,
    );

    log.info(
      {
        count: result.data.length,
        hasMore: result.pagination.hasMore,
        nextCursor: result.pagination.nextCursor,
        maxMembers,
      },
      "Small circles fetched successfully",
    );

    res.status(200).json(result);
  },
);

const getSimilarCircles = withLogging<AuthenticatedRequest>(
  controllerLogger,
  "getSimilarCircles",
  async ({ req, res, log }) => {
    log.info("Fetching similar study circles");

    const { circleId } = StudyCircleIdParamSchema.parse(req.params);

    const similarPaginationSchema = createPaginationSchema(10, 50, "uuid");
    const { limit, cursor } = similarPaginationSchema.parse(req.query);

    const result = await circleService.search.getSimilarCircles(req.user.id, circleId, {
      limit,
      cursor: cursor as string | undefined,
    });

    log.info(
      {
        count: result.data.length,
        hasMore: result.pagination.hasMore,
        nextCursor: result.pagination.nextCursor,
        referenceGroupId: circleId,
      },
      "Similar circles fetched successfully",
    );

    res.status(200).json(result);
  },
);

const getCirclesByCreator = withLogging<AuthenticatedRequest>(
  controllerLogger,
  "getCirclesByCreator",
  async ({ req, res, log }) => {
    log.info("Fetching circles by creator");

    const { creatorId } = CreatorIdParamSchema.parse(req.params);

    const creatorPaginationSchema = createPaginationSchema(10, 50, "uuid");
    const { limit, cursor } = creatorPaginationSchema.parse(req.query);

    const result = await circleService.search.getCirclesByCreator(req.user.id, creatorId, {
      limit,
      cursor: cursor as string | undefined,
    });

    log.info(
      {
        count: result.data.length,
        hasMore: result.pagination.hasMore,
        nextCursor: result.pagination.nextCursor,
        creatorId,
      },
      "Circles by creator fetched successfully",
    );

    res.status(200).json(result);
  },
);

const searchCircles = withLogging<AuthenticatedRequest>(
  controllerLogger,
  "searchCircles",
  async ({ req, res, log }) => {
    log.info("Searching study circles");

    const filters = CircleSearchFiltersSchema.parse(req.query);

    const searchPaginationSchema = createPaginationSchema(10, 50, "uuid");
    const { limit, cursor } = searchPaginationSchema.parse(req.query);

    const result = await circleService.search.searchCircles(
      req.user.id,
      filters,
      {
        limit,
        cursor: cursor as string | undefined,
      },
    );

    log.info(
      {
        count: result.data.length,
        hasMore: result.pagination.hasMore,
        nextCursor: result.pagination.nextCursor,
        filters,
      },
      "Circles search completed successfully",
    );

    res.status(200).json(result);
  },
);

const getSearchSuggestions = withLogging(
  controllerLogger,
  "getSearchSuggestions",
  async ({ req, res, log }) => {
    log.info("Fetching search suggestions");

    const { query, limit } = SearchSuggestionQuerySchema.parse(req.query);

    const result = await circleService.search.getSearchSuggestions(query, limit);

    log.info(
      {
        count: result.length,
        query,
      },
      "Search suggestions fetched successfully",
    );

    res.status(200).json({ data: result });
  },
);

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
