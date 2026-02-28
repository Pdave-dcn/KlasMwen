/* eslint-disable max-lines-per-function */
import prisma from "../../../../core/config/db.js";
import {
  BaseSelectors,
  type CirclePaginationCursor,
  type CircleSearchFilters,
  type CircleForSearch,
  type CircleForTrending,
  type CircleForActive,
  type CircleSuggestionResult,
  type CircleForDiscovery,
} from "../CircleTypes.js";

/**
 * Repository for circle search and discovery operations.
 * Handles all database queries related to searching and filtering circles.
 */
class CircleSearchRepository {
  /**
   * Search circles with advanced filters.
   * Supports text search, privacy filters, member count filters, and more.
   */
  static async searchCircles(
    userId: string,
    filters: CircleSearchFilters,
    pagination: CirclePaginationCursor,
  ): Promise<CircleForSearch[]> {
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
        // Tag filters
        ...(filters.tagIds &&
          filters.tagIds.length > 0 && {
            chatGroupTags: {
              some: {
                tag: {
                  id: {
                    in: filters.tagIds,
                  },
                },
              },
            },
          }),
        // Privacy filter
        ...(filters.isPrivate !== undefined && {
          isPrivate: filters.isPrivate,
        }),
        // Creator filter
        ...(filters.creatorId && {
          creatorId: filters.creatorId,
        }),
        // Exclude circles user is already a member of
        ...(filters.excludeJoined && {
          members: {
            none: {
              userId,
            },
          },
        }),
      },
      select: BaseSelectors.circleForSearch,
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
   * Find public circles excluding those the user has joined.
   * Used for the main discovery page.
   */
  static async findPublicCircles(
    userId: string,
    pagination: CirclePaginationCursor,
  ): Promise<CircleForDiscovery[]> {
    return await prisma.chatGroup.findMany({
      where: {
        isPrivate: false,
        members: {
          none: {
            userId,
          },
        },
      },
      select: BaseSelectors.circleForDiscovery,
      orderBy: { createdAt: "desc" },
      take: pagination.limit + 1,
      ...(pagination.cursor && {
        cursor: { id: pagination.cursor },
        skip: 1,
      }),
    });
  }

  /**
   * Find popular circles sorted by member count.
   * Excludes circles the user has already joined.
   */
  static async findPopularCircles(
    userId: string,
    pagination: CirclePaginationCursor,
  ): Promise<CircleForSearch[]> {
    return await prisma.chatGroup.findMany({
      where: {
        isPrivate: false,
        members: {
          none: {
            userId,
          },
        },
      },
      select: BaseSelectors.circleForSearch,
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
   * Find trending circles based on recent message activity.
   * Circles with the most messages in the specified timeframe.
   */
  static async findTrendingCircles(
    userId: string,
    pagination: CirclePaginationCursor,
    timeframeDays: number = 7,
  ): Promise<CircleForTrending[]> {
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
      select: BaseSelectors.circleForTrending,
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
   * Find circles similar to a reference group.
   * Matches circles with similar names or same creator.
   */
  static async findSimilarCircles(
    userId: string,
    referenceCircle: { name: string; creatorId: string; id: string },
    pagination: CirclePaginationCursor,
  ): Promise<CircleForDiscovery[]> {
    // Extract keywords from the reference circle name
    const keywords = referenceCircle.name.toLowerCase().split(/\s+/);
    const primaryKeyword = keywords[0] || "";

    return await prisma.chatGroup.findMany({
      where: {
        isPrivate: false,
        id: {
          not: referenceCircle.id, // Exclude the reference circle itself
        },
        members: {
          none: {
            userId,
          },
        },
        OR: [
          // Circles with similar names
          {
            name: {
              contains: primaryKeyword,
              mode: "insensitive",
            },
          },
          // Circles by the same creator
          {
            creatorId: referenceCircle.creatorId,
          },
        ],
      },
      select: BaseSelectors.circleForDiscovery,
      orderBy: { createdAt: "desc" },
      take: pagination.limit + 1,
      ...(pagination.cursor && {
        cursor: { id: pagination.cursor },
        skip: 1,
      }),
    });
  }

  /**
   * Find newly created circles.
   * Returns the most recently created public circles.
   */
  static async findNewCircles(
    userId: string,
    pagination: CirclePaginationCursor,
  ): Promise<CircleForDiscovery[]> {
    return await prisma.chatGroup.findMany({
      where: {
        isPrivate: false,
        members: {
          none: {
            userId,
          },
        },
      },
      select: BaseSelectors.circleForDiscovery,
      orderBy: { createdAt: "desc" },
      take: pagination.limit + 1,
      ...(pagination.cursor && {
        cursor: { id: pagination.cursor },
        skip: 1,
      }),
    });
  }

  /**
   * Find circles by creator.
   * Returns all public circles created by a specific user.
   */
  static async findCirclesByCreator(
    userId: string,
    creatorId: string,
    pagination: CirclePaginationCursor,
  ): Promise<CircleForDiscovery[]> {
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
      select: BaseSelectors.circleForDiscovery,
      orderBy: { createdAt: "desc" },
      take: pagination.limit + 1,
      ...(pagination.cursor && {
        cursor: { id: pagination.cursor },
        skip: 1,
      }),
    });
  }

  /**
   * Find active circles (circles with recent messages).
   * Returns circles that have had activity in the last N days.
   */
  static async findActiveCircles(
    userId: string,
    pagination: CirclePaginationCursor,
    activityDays: number = 3,
  ): Promise<CircleForActive[]> {
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
      select: BaseSelectors.circleForActive,
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
   * Find small circles (under a certain member threshold).
   * Good for users who prefer intimate circle settings.
   */
  static async findSmallCircles(
    userId: string,
    pagination: CirclePaginationCursor,
    maxMembers: number = 10,
  ): Promise<CircleForSearch[]> {
    const results = await prisma.chatGroup.findMany({
      where: {
        isPrivate: false,
        members: {
          none: {
            userId,
          },
        },
      },
      select: BaseSelectors.circleForSearch,
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
   * Returns circle names that match the query for autocomplete.
   */
  static async getSearchSuggestions(
    query: string,
    limit: number = 10,
  ): Promise<CircleSuggestionResult[]> {
    return await prisma.chatGroup.findMany({
      where: {
        isPrivate: false,
        name: {
          contains: query,
          mode: "insensitive",
        },
      },
      select: BaseSelectors.circleSuggestion,
      orderBy: {
        members: {
          _count: "desc",
        },
      },
      take: limit,
    });
  }

  /**
   * Helper method to filter circles by member count.
   * Applied after the initial query since Prisma doesn't support
   * filtering by aggregated counts in the where clause.
   */
  private static filterByMemberCount<
    T extends { _count?: { members: number } },
  >(circles: T[], filters: CircleSearchFilters): T[] {
    let filtered = circles;

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

export default CircleSearchRepository;
