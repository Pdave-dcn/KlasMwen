import prisma from "../../../../core/config/db.js";
import {
  BaseSelectors,
  type GroupPaginationCursor,
  type GroupSearchFilters,
  type ChatGroupForSearch,
  type ChatGroupForTrending,
  type ChatGroupForActive,
  type ChatGroupSuggestionResult,
  type ChatGroupForDiscovery,
} from "../chatTypes.js";

/**
 * Repository for chat group search and discovery operations.
 * Handles all database queries related to searching and filtering chat groups.
 */
class ChatSearchRepository {
  /**
   * Search groups with advanced filters.
   * Supports text search, privacy filters, member count filters, and more.
   */
  static async searchGroups(
    userId: string,
    filters: GroupSearchFilters,
    pagination: GroupPaginationCursor,
  ): Promise<ChatGroupForSearch[]> {
    const results = await prisma.chatGroup.findMany({
      where: {
        // Text search on name and description
        ...(filters.query && {
          OR: [
            {
              name: {
                contains: filters.query,
                mode: "insensitive",
              },
            },
            {
              description: {
                contains: filters.query,
                mode: "insensitive",
              },
            },
          ],
        }),
        // Privacy filter
        ...(filters.isPrivate !== undefined && {
          isPrivate: filters.isPrivate,
        }),
        // Creator filter
        ...(filters.creatorId && {
          creatorId: filters.creatorId,
        }),
        // Exclude groups user is already a member of
        ...(filters.excludeJoined && {
          members: {
            none: {
              userId,
            },
          },
        }),
      },
      select: BaseSelectors.chatGroupForSearch,
      orderBy: { createdAt: "desc" },
      take: pagination.limit + 1,
      ...(pagination.cursor && {
        cursor: { id: pagination.cursor },
        skip: 1,
      }),
    });

    // Apply member count filters post-query
    return this.filterByMemberCount(results, filters);
  }

  /**
   * Find public groups excluding those the user has joined.
   * Used for the main discovery page.
   */
  static async findPublicGroups(
    userId: string,
    pagination: GroupPaginationCursor,
  ): Promise<ChatGroupForDiscovery[]> {
    return await prisma.chatGroup.findMany({
      where: {
        isPrivate: false,
        members: {
          none: {
            userId,
          },
        },
      },
      select: BaseSelectors.chatGroupForDiscovery,
      orderBy: { createdAt: "desc" },
      take: pagination.limit + 1,
      ...(pagination.cursor && {
        cursor: { id: pagination.cursor },
        skip: 1,
      }),
    });
  }

  /**
   * Find popular groups sorted by member count.
   * Excludes groups the user has already joined.
   */
  static async findPopularGroups(
    userId: string,
    pagination: GroupPaginationCursor,
  ): Promise<ChatGroupForSearch[]> {
    return await prisma.chatGroup.findMany({
      where: {
        isPrivate: false,
        members: {
          none: {
            userId,
          },
        },
      },
      select: BaseSelectors.chatGroupForSearch,
      orderBy: {
        members: {
          _count: "desc",
        },
      },
      take: pagination.limit + 1,
      ...(pagination.cursor && {
        cursor: { id: pagination.cursor },
        skip: 1,
      }),
    });
  }

  /**
   * Find trending groups based on recent message activity.
   * Groups with the most messages in the specified timeframe.
   */
  static async findTrendingGroups(
    userId: string,
    pagination: GroupPaginationCursor,
    timeframeDays: number = 7,
  ): Promise<ChatGroupForTrending[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeframeDays);

    return await prisma.chatGroup.findMany({
      where: {
        isPrivate: false,
        members: {
          none: {
            userId,
          },
        },
        messages: {
          some: {
            createdAt: {
              gte: cutoffDate,
            },
          },
        },
      },
      select: BaseSelectors.chatGroupForTrending,
      orderBy: {
        messages: {
          _count: "desc",
        },
      },
      take: pagination.limit + 1,
      ...(pagination.cursor && {
        cursor: { id: pagination.cursor },
        skip: 1,
      }),
    });
  }

  /**
   * Find groups similar to a reference group.
   * Matches groups with similar names or same creator.
   */
  static async findSimilarGroups(
    userId: string,
    referenceGroup: { name: string; creatorId: string; id: string },
    pagination: GroupPaginationCursor,
  ): Promise<ChatGroupForDiscovery[]> {
    // Extract keywords from the reference group name
    const keywords = referenceGroup.name.toLowerCase().split(/\s+/);
    const primaryKeyword = keywords[0] || "";

    return await prisma.chatGroup.findMany({
      where: {
        isPrivate: false,
        id: {
          not: referenceGroup.id, // Exclude the reference group itself
        },
        members: {
          none: {
            userId,
          },
        },
        OR: [
          // Groups with similar names
          {
            name: {
              contains: primaryKeyword,
              mode: "insensitive",
            },
          },
          // Groups by the same creator
          {
            creatorId: referenceGroup.creatorId,
          },
        ],
      },
      select: BaseSelectors.chatGroupForDiscovery,
      orderBy: { createdAt: "desc" },
      take: pagination.limit + 1,
      ...(pagination.cursor && {
        cursor: { id: pagination.cursor },
        skip: 1,
      }),
    });
  }

  /**
   * Find newly created groups.
   * Returns the most recently created public groups.
   */
  static async findNewGroups(
    userId: string,
    pagination: GroupPaginationCursor,
  ): Promise<ChatGroupForDiscovery[]> {
    return await prisma.chatGroup.findMany({
      where: {
        isPrivate: false,
        members: {
          none: {
            userId,
          },
        },
      },
      select: BaseSelectors.chatGroupForDiscovery,
      orderBy: { createdAt: "desc" },
      take: pagination.limit + 1,
      ...(pagination.cursor && {
        cursor: { id: pagination.cursor },
        skip: 1,
      }),
    });
  }

  /**
   * Find groups by creator.
   * Returns all public groups created by a specific user.
   */
  static async findGroupsByCreator(
    userId: string,
    creatorId: string,
    pagination: GroupPaginationCursor,
  ): Promise<ChatGroupForDiscovery[]> {
    return await prisma.chatGroup.findMany({
      where: {
        creatorId,
        isPrivate: false,
        members: {
          none: {
            userId,
          },
        },
      },
      select: BaseSelectors.chatGroupForDiscovery,
      orderBy: { createdAt: "desc" },
      take: pagination.limit + 1,
      ...(pagination.cursor && {
        cursor: { id: pagination.cursor },
        skip: 1,
      }),
    });
  }

  /**
   * Find active groups (groups with recent messages).
   * Returns groups that have had activity in the last N days.
   */
  static async findActiveGroups(
    userId: string,
    pagination: GroupPaginationCursor,
    activityDays: number = 3,
  ): Promise<ChatGroupForActive[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - activityDays);

    return await prisma.chatGroup.findMany({
      where: {
        isPrivate: false,
        members: {
          none: {
            userId,
          },
        },
        messages: {
          some: {
            createdAt: {
              gte: cutoffDate,
            },
          },
        },
      },
      select: BaseSelectors.chatGroupForActive,
      orderBy: {
        messages: {
          _count: "desc",
        },
      },
      take: pagination.limit + 1,
      ...(pagination.cursor && {
        cursor: { id: pagination.cursor },
        skip: 1,
      }),
    });
  }

  /**
   * Find small groups (under a certain member threshold).
   * Good for users who prefer intimate group settings.
   */
  static async findSmallGroups(
    userId: string,
    pagination: GroupPaginationCursor,
    maxMembers: number = 10,
  ): Promise<ChatGroupForSearch[]> {
    const results = await prisma.chatGroup.findMany({
      where: {
        isPrivate: false,
        members: {
          none: {
            userId,
          },
        },
      },
      select: BaseSelectors.chatGroupForSearch,
      orderBy: { createdAt: "desc" },
      take: pagination.limit + 1,
      ...(pagination.cursor && {
        cursor: { id: pagination.cursor },
        skip: 1,
      }),
    });

    // Filter by member count
    return results.filter((group) => group._count.members <= maxMembers);
  }

  /**
   * Get search suggestions based on partial query.
   * Returns group names that match the query for autocomplete.
   */
  static async getSearchSuggestions(
    query: string,
    limit: number = 10,
  ): Promise<ChatGroupSuggestionResult[]> {
    return await prisma.chatGroup.findMany({
      where: {
        isPrivate: false,
        name: {
          contains: query,
          mode: "insensitive",
        },
      },
      select: BaseSelectors.chatGroupSuggestion,
      orderBy: {
        members: {
          _count: "desc",
        },
      },
      take: limit,
    });
  }

  /**
   * Helper method to filter groups by member count.
   * Applied after the initial query since Prisma doesn't support
   * filtering by aggregated counts in the where clause.
   */
  private static filterByMemberCount<
    T extends { _count?: { members: number } },
  >(groups: T[], filters: GroupSearchFilters): T[] {
    let filtered = groups;

    if (filters.minMembers !== undefined) {
      const minMembers = filters.minMembers;
      filtered = filtered.filter(
        (g) => g._count && g._count.members >= minMembers,
      );
    }

    if (filters.maxMembers !== undefined) {
      const maxMembers = filters.maxMembers;
      filtered = filtered.filter(
        (g) => g._count && g._count.members <= maxMembers,
      );
    }

    return filtered;
  }
}

export default ChatSearchRepository;
