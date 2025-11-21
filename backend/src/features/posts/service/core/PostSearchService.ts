import PostRepository from "../repositories/postRepository";

import { PostQueryService } from "./PostQueryService";

import type { PaginatedPostsResponse } from "../types/postTypes";
import type { Prisma } from "@prisma/client";

/**
 * Handles post search operations.
 * Builds complex search queries and delegates to PostQueryService.
 */
export class PostSearchService {
  /**
   * Build search condition from search term and tag filters.
   */
  private static buildSearchCondition(
    searchTerm?: string,
    tagIds?: number[]
  ): Prisma.PostWhereInput {
    const condition: Prisma.PostWhereInput = {};
    const searchClauses: Prisma.PostWhereInput[] = [];

    if (searchTerm) {
      searchClauses.push(
        { title: { contains: searchTerm, mode: "insensitive" } },
        { content: { contains: searchTerm, mode: "insensitive" } }
      );
    }

    if (tagIds?.length) {
      condition.AND = [
        ...(searchClauses.length ? [{ OR: searchClauses }] : []),
        { postTags: { some: { tag: { id: { in: tagIds } } } } },
      ];
    } else if (searchClauses.length) {
      condition.OR = searchClauses;
    }

    return condition;
  }

  /**
   * Search posts by term and/or tags.
   */
  static async searchPosts(
    userId: string,
    limit: number,
    searchTerm?: string,
    cursor?: string,
    tagIds?: number[]
  ): Promise<PaginatedPostsResponse> {
    const where = this.buildSearchCondition(searchTerm, tagIds);
    const [result, totalCount] = await Promise.all([
      PostQueryService["fetchAndProcessPosts"](where, limit, userId, cursor),
      PostRepository.countPosts(where),
    ]);

    return {
      ...result,
      pagination: { ...result.pagination, totalPosts: totalCount },
    };
  }
}
