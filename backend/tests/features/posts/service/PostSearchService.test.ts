import { describe, it, expect, vi, beforeEach } from "vitest";

import { postSearchService } from "../../../../src/features/posts/service/core/PostSearchService.js";

const mockCountPosts = vi.fn();

const mockFetchAndProcessPosts = vi.fn();

vi.mock(
  "../../../../src/features/posts/service/repositories/postRepository.js",
  () => ({
    postRepository: {
      query: {
        countPosts: (...args: unknown[]) => mockCountPosts(...args),
      },
    },
  }),
);

vi.mock(
  "../../../../src/features/posts/service/core/PostQueryService.js",
  () => ({
    postQueryService: {
      fetchAndProcessPosts: (...args: unknown[]) =>
        mockFetchAndProcessPosts(...args),
    },
  }),
);

describe("PostSearchService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const makePaginationResult = (
    overrides: Record<string, unknown> = {},
  ) => ({
    posts: [],
    pagination: {
      nextCursor: null,
      hasMore: false,
      ...overrides,
    },
  });

  it("should search by search term", async () => {
    const baseResult = makePaginationResult();
    mockFetchAndProcessPosts.mockResolvedValue(baseResult);
    mockCountPosts.mockResolvedValue(3);

    const result = await postSearchService.searchPosts("u1", 10, "typescript");

    expect(mockFetchAndProcessPosts).toHaveBeenCalledWith(
      {
        OR: [
          { title: { contains: "typescript", mode: "insensitive" } },
          { content: { contains: "typescript", mode: "insensitive" } },
        ],
      },
      10,
      "u1",
      undefined,
    );
    expect(result.pagination.totalPosts).toBe(3);
  });

  it("should search by tag IDs", async () => {
    const baseResult = makePaginationResult();
    mockFetchAndProcessPosts.mockResolvedValue(baseResult);
    mockCountPosts.mockResolvedValue(2);

    await postSearchService.searchPosts("u1", 10, undefined, undefined, [1, 2]);

    expect(mockFetchAndProcessPosts).toHaveBeenCalledWith(
      {
        AND: [
          { postTags: { some: { tag: { id: { in: [1, 2] } } } } },
        ],
      },
      10,
      "u1",
      undefined,
    );
  });

  it("should search by both term and tags", async () => {
    const baseResult = makePaginationResult();
    mockFetchAndProcessPosts.mockResolvedValue(baseResult);
    mockCountPosts.mockResolvedValue(1);

    await postSearchService.searchPosts("u1", 10, "react", "cursor-1", [1]);

    expect(mockFetchAndProcessPosts).toHaveBeenCalledWith(
      {
        AND: [
          {
            OR: [
              { title: { contains: "react", mode: "insensitive" } },
              { content: { contains: "react", mode: "insensitive" } },
            ],
          },
          { postTags: { some: { tag: { id: { in: [1] } } } } },
        ],
      },
      10,
      "u1",
      "cursor-1",
    );
  });

  it("should pass cursor to query service", async () => {
    mockFetchAndProcessPosts.mockResolvedValue(makePaginationResult());
    mockCountPosts.mockResolvedValue(0);

    await postSearchService.searchPosts("u1", 5, undefined, "cursor-abc");

    expect(mockFetchAndProcessPosts).toHaveBeenCalledWith(
      {},
      5,
      "u1",
      "cursor-abc",
    );
  });

  it("should return empty result when nothing matches", async () => {
    mockFetchAndProcessPosts.mockResolvedValue(makePaginationResult());
    mockCountPosts.mockResolvedValue(0);

    const result = await postSearchService.searchPosts("u1", 10, "zzzznotfound");

    expect(result.posts).toEqual([]);
    expect(result.pagination.totalPosts).toBe(0);
  });

  it("should return results with totalPosts in pagination", async () => {
    const enriched = makePaginationResult({ hasMore: true, nextCursor: "p5" });
    mockFetchAndProcessPosts.mockResolvedValue(enriched);
    mockCountPosts.mockResolvedValue(7);

    const result = await postSearchService.searchPosts("u1", 5, "test");

    expect(result.pagination.totalPosts).toBe(7);
    expect(result.pagination.hasMore).toBe(true);
    expect(result.pagination.nextCursor).toBe("p5");
  });
});
