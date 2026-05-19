import { CircleNotFoundError } from "../../../../core/error/custom/circle.error.js";
import { processPaginatedResults } from "../../../../utils/pagination.util.js";
import CircleTransformers from "../CircleTransformers.js";
import CircleRepository from "../Repositories/CircleRepository.js";
import CircleSearchRepository from "../Repositories/CircleSearchRepository.js";

import type {
  CirclePaginationCursor,
  CircleSearchFilters,
} from "../CircleTypes.js";

export class CircleSearchService {
  async searchCircles(
    userId: string,
    filters: CircleSearchFilters,
    pagination: CirclePaginationCursor,
  ) {
    const sanitizedFilters = {
      ...filters,
      query: filters.query ? filters.query.replace(/[%_]/g, "\\$&") : undefined,
    };

    const groups = await CircleSearchRepository.searchCircles(
      userId,
      sanitizedFilters,
      pagination,
    );

    const transformedGroups =
      CircleTransformers.transformCirclesForDiscovery(groups);

    return processPaginatedResults(transformedGroups, pagination.limit, "id");
  }

  async discoverCircles(
    userId: string,
    pagination: CirclePaginationCursor,
  ) {
    const circles = await CircleSearchRepository.findPublicCircles(
      userId,
      pagination,
    );

    const transformedGroups =
      CircleTransformers.transformCirclesForDiscovery(circles);

    return processPaginatedResults(transformedGroups, pagination.limit, "id");
  }

  async getRecommendedCircles(
    userId: string,
    pagination: CirclePaginationCursor,
  ) {
    const groups = await CircleSearchRepository.findPopularCircles(
      userId,
      pagination,
    );

    const transformedGroups =
      CircleTransformers.transformCirclesForDiscovery(groups);

    return processPaginatedResults(transformedGroups, pagination.limit, "id");
  }

  async getTrendingCircles(
    userId: string,
    pagination: CirclePaginationCursor,
    timeframe: number = 7,
  ) {
    const circles = await CircleSearchRepository.findTrendingCircles(
      userId,
      pagination,
      timeframe,
    );

    const transformedGroups =
      CircleTransformers.transformCirclesForDiscovery(circles);

    return processPaginatedResults(transformedGroups, pagination.limit, "id");
  }

  async getSimilarCircles(
    userId: string,
    referenceCircleId: string,
    pagination: CirclePaginationCursor,
  ) {
    const referenceCircle =
      await CircleRepository.findCircleById(referenceCircleId);
    if (!referenceCircle) {
      throw new CircleNotFoundError(referenceCircleId);
    }

    const circles = await CircleSearchRepository.findSimilarCircles(
      userId,
      {
        id: referenceCircleId,
        name: referenceCircle.name,
        creatorId: referenceCircle.creator.id,
      },
      pagination,
    );

    const transformedCircles =
      CircleTransformers.transformCirclesForDiscovery(circles);

    return processPaginatedResults(transformedCircles, pagination.limit, "id");
  }

  async getNewCircles(
    userId: string,
    pagination: CirclePaginationCursor,
  ) {
    const circles = await CircleSearchRepository.findNewCircles(
      userId,
      pagination,
    );

    const transformedCircles =
      CircleTransformers.transformCirclesForDiscovery(circles);

    return processPaginatedResults(transformedCircles, pagination.limit, "id");
  }

  async getActiveCircles(
    userId: string,
    pagination: CirclePaginationCursor,
    activityDays: number = 3,
  ) {
    const circles = await CircleSearchRepository.findActiveCircles(
      userId,
      pagination,
      activityDays,
    );

    const transformedCircles =
      CircleTransformers.transformCirclesForDiscovery(circles);

    return processPaginatedResults(transformedCircles, pagination.limit, "id");
  }

  async getSmallCircles(
    userId: string,
    pagination: CirclePaginationCursor,
    maxMembers: number = 10,
  ) {
    const circles = await CircleSearchRepository.findSmallCircles(
      userId,
      pagination,
      maxMembers,
    );

    const transformedCircles =
      CircleTransformers.transformCirclesForDiscovery(circles);

    return processPaginatedResults(transformedCircles, pagination.limit, "id");
  }

  async getCirclesByCreator(
    userId: string,
    creatorId: string,
    pagination: CirclePaginationCursor,
  ) {
    const circles = await CircleSearchRepository.findCirclesByCreator(
      userId,
      creatorId,
      pagination,
    );

    const transformedCircles =
      CircleTransformers.transformCirclesForDiscovery(circles);

    return processPaginatedResults(transformedCircles, pagination.limit, "id");
  }

  async getSearchSuggestions(query: string, limit: number = 10) {
    const suggestions = await CircleSearchRepository.getSearchSuggestions(
      query,
      limit,
    );
    return CircleTransformers.transformCirclesForSuggestion(suggestions);
  }
}
