import { ChatGroupNotFoundError } from "../../../../core/error/custom/chat.error.js";
import { processPaginatedResults } from "../../../../utils/pagination.util.js";
import ChatTransformers from "../ChatTransformers.js";
import ChatRepository from "../Repositories/ChatRepository.js";
import ChatSearchRepository from "../Repositories/ChatSearchRepository.js";

import type {
  GroupPaginationCursor,
  GroupSearchFilters,
} from "../chatTypes.js";

/**
 * Service for chat group search and discovery operations.
 * Handles searching, filtering, and discovering chat groups.
 */
export class ChatGroupSearchService {
  /**
   * Search for chat groups based on filters and query.
   * Excludes groups the user is already a member of unless specified.
   */
  static async searchGroups(
    userId: string,
    filters: GroupSearchFilters,
    pagination: GroupPaginationCursor,
  ) {
    const groups = await ChatSearchRepository.searchGroups(
      userId,
      filters,
      pagination,
    );

    const transformedGroups =
      ChatTransformers.transformGroupsForDiscovery(groups);

    return processPaginatedResults(transformedGroups, pagination.limit, "id");
  }

  /**
   * Discover public groups (convenience method for searchGroups).
   * Only returns public groups the user hasn't joined.
   */
  static async discoverGroups(
    userId: string,
    pagination: GroupPaginationCursor,
  ) {
    const groups = await ChatSearchRepository.findPublicGroups(
      userId,
      pagination,
    );

    const transformedGroups =
      ChatTransformers.transformGroupsForDiscovery(groups);

    return processPaginatedResults(transformedGroups, pagination.limit, "id");
  }

  /**
   * Search groups by name or description.
   */
  static async searchByQuery(
    userId: string,
    query: string,
    pagination: GroupPaginationCursor,
  ) {
    return await this.searchGroups(
      userId,
      {
        query,
        isPrivate: false,
        excludeJoined: true,
      },
      pagination,
    );
  }

  /**
   * Get recommended groups (popular groups by member count).
   */
  static async getRecommendedGroups(
    userId: string,
    pagination: GroupPaginationCursor,
  ) {
    const groups = await ChatSearchRepository.findPopularGroups(
      userId,
      pagination,
    );

    const transformedGroups =
      ChatTransformers.transformGroupsForDiscovery(groups);

    return processPaginatedResults(transformedGroups, pagination.limit, "id");
  }

  /**
   * Get trending groups (most active in recent time).
   */
  static async getTrendingGroups(
    userId: string,
    pagination: GroupPaginationCursor,
    timeframe: number = 7,
  ) {
    const groups = await ChatSearchRepository.findTrendingGroups(
      userId,
      pagination,
      timeframe,
    );

    const transformedGroups =
      ChatTransformers.transformGroupsForDiscovery(groups);

    return processPaginatedResults(transformedGroups, pagination.limit, "id");
  }

  /**
   * Get similar groups based on a reference group.
   */
  static async getSimilarGroups(
    userId: string,
    referenceGroupId: string,
    pagination: GroupPaginationCursor,
  ) {
    const referenceGroup = await ChatRepository.findGroupById(referenceGroupId);
    if (!referenceGroup) {
      throw new ChatGroupNotFoundError(referenceGroupId);
    }

    const groups = await ChatSearchRepository.findSimilarGroups(
      userId,
      {
        id: referenceGroupId,
        name: referenceGroup.name,
        creatorId: referenceGroup.creator.id,
      },
      pagination,
    );

    const transformedGroups =
      ChatTransformers.transformGroupsForDiscovery(groups);

    return processPaginatedResults(transformedGroups, pagination.limit, "id");
  }

  /**
   * Get newly created groups.
   */
  static async getNewGroups(userId: string, pagination: GroupPaginationCursor) {
    const groups = await ChatSearchRepository.findNewGroups(userId, pagination);

    const transformedGroups =
      ChatTransformers.transformGroupsForDiscovery(groups);

    return processPaginatedResults(transformedGroups, pagination.limit, "id");
  }

  /**
   * Get active groups (groups with recent activity).
   */
  static async getActiveGroups(
    userId: string,
    pagination: GroupPaginationCursor,
    activityDays: number = 3,
  ) {
    const groups = await ChatSearchRepository.findActiveGroups(
      userId,
      pagination,
      activityDays,
    );

    const transformedGroups =
      ChatTransformers.transformGroupsForDiscovery(groups);

    return processPaginatedResults(transformedGroups, pagination.limit, "id");
  }

  /**
   * Get small groups (under a certain member threshold).
   */
  static async getSmallGroups(
    userId: string,
    pagination: GroupPaginationCursor,
    maxMembers: number = 10,
  ) {
    const groups = await ChatSearchRepository.findSmallGroups(
      userId,
      pagination,
      maxMembers,
    );

    const transformedGroups =
      ChatTransformers.transformGroupsForDiscovery(groups);

    return processPaginatedResults(transformedGroups, pagination.limit, "id");
  }

  /**
   * Get groups by a specific creator.
   */
  static async getGroupsByCreator(
    userId: string,
    creatorId: string,
    pagination: GroupPaginationCursor,
  ) {
    const groups = await ChatSearchRepository.findGroupsByCreator(
      userId,
      creatorId,
      pagination,
    );

    const transformedGroups =
      ChatTransformers.transformGroupsForDiscovery(groups);

    return processPaginatedResults(transformedGroups, pagination.limit, "id");
  }

  /**
   * Get search suggestions for autocomplete.
   */
  static async getSearchSuggestions(query: string, limit: number = 10) {
    return await ChatSearchRepository.getSearchSuggestions(query, limit);
  }
}
