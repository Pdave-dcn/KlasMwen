import { CircleNotFoundError } from "../../../../core/error/custom/circle.error.js";
import { processPaginatedResults } from "../../../../utils/pagination.util.js";
import CircleTransformers from "../CircleTransformers.js";
import CircleRepository from "../Repositories/CircleRepository.js";
import CircleSearchRepository from "../Repositories/CircleSearchRepository.js";

import type {
  CirclePaginationCursor,
  CircleSearchFilters,
} from "../CircleTypes.js";

/**
 * Service for circle search and discovery operations.
 * Handles searching, filtering, and discovering circles.
 */
export class CircleSearchService {
  /**
   * Search for circles based on filters and query.
   * Excludes groups the user is already a member of unless specified.
   */
  static async searchCircles(
    userId: string,
    filters: CircleSearchFilters,
    pagination: CirclePaginationCursor,
  ) {
    const groups = await CircleSearchRepository.searchCircles(
      userId,
      filters,
      pagination,
    );

    const transformedGroups =
      CircleTransformers.transformCirclesForDiscovery(groups);

    return processPaginatedResults(transformedGroups, pagination.limit, "id");
  }

  /**
   * Discover public circles (convenience method for searchCircles).
   * Only returns public circles the user hasn't joined.
   */
  static async discoverCircles(
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

  /**
   * Get recommended circles (popular circles by member count).
   */
  static async getRecommendedCircles(
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

  /**
   * Get trending circles (most active in recent time).
   */
  static async getTrendingCircles(
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

  /**
   * Get similar circles based on a reference circle.
   */
  static async getSimilarCircles(
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

  /**
   * Get newly created circles.
   */
  static async getNewCircles(
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

  /**
   * Get active circles (circles with recent activity).
   */
  static async getActiveCircles(
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

  /**
   * Get small circles (under a certain member threshold).
   */
  static async getSmallCircles(
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

  /**
   * Get circles by a specific creator.
   */
  static async getCirclesByCreator(
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

  /**
   * Get search suggestions for autocomplete.
   */
  static async getSearchSuggestions(query: string, limit: number = 10) {
    const suggestions = await CircleSearchRepository.getSearchSuggestions(
      query,
      limit,
    );
    return CircleTransformers.transformCirclesForSuggestion(suggestions);
  }
}
