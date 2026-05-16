import {
  postRepository,
  type IPostRepository,
} from "../repositories/postRepository.js";

import {
  postQueryService,
  type IPostQueryService,
} from "./PostQueryService.js";

import type { PaginatedPostsResponse } from "../types/postTypes.js";
import type { Prisma } from "@prisma/client";

interface IPostSearchService {
  searchPosts(
    userId: string,
    limit: number,
    searchTerm?: string,
    cursor?: string,
    tagIds?: number[],
  ): Promise<PaginatedPostsResponse>;
}

class PostSearchService implements IPostSearchService {
  constructor(
    private repository: IPostRepository,
    private queryService: IPostQueryService,
  ) {}

  private buildSearchCondition(
    searchTerm?: string,
    tagIds?: number[],
  ): Prisma.PostWhereInput {
    const condition: Prisma.PostWhereInput = {};
    const searchClauses: Prisma.PostWhereInput[] = [];

    if (searchTerm) {
      searchClauses.push(
        { title: { contains: searchTerm, mode: "insensitive" } },
        { content: { contains: searchTerm, mode: "insensitive" } },
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

  async searchPosts(
    userId: string,
    limit: number,
    searchTerm?: string,
    cursor?: string,
    tagIds?: number[],
  ): Promise<PaginatedPostsResponse> {
    const where = this.buildSearchCondition(searchTerm, tagIds);
    const [result, totalCount] = await Promise.all([
      this.queryService.fetchAndProcessPosts(where, limit, userId, cursor),
      this.repository.query.countPosts(where),
    ]);

    return {
      ...result,
      pagination: { ...result.pagination, totalPosts: totalCount },
    };
  }
}

const postSearchService = new PostSearchService(
  postRepository,
  postQueryService,
);
export { postSearchService, type IPostSearchService };
