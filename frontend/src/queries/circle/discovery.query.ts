import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import {
  getCirclesForDiscovery,
  getRecommendedCircles,
  getTrendingCircles,
  getNewCircles,
  getSmallCircles,
  searchCircles,
  getSimilarCircles,
  getCirclesByCreator,
  getSearchSuggestions,
  type GroupSearchFilters,
} from "@/api/circle";

export const useCirclesForDiscoveryQuery = (limit: number = 10) => {
  return useInfiniteQuery({
    queryKey: ["circles", "discover", limit],
    queryFn: ({ pageParam }) => getCirclesForDiscovery(limit, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.nextCursor
        : undefined;
    },
  });
};

export const useRecommendedCirclesQuery = (limit = 5) => {
  return useInfiniteQuery({
    queryKey: ["circles", "recommended", limit],
    queryFn: ({ pageParam }) => getRecommendedCircles(pageParam, limit),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.nextCursor
        : undefined;
    },
  });
};

export const useTrendingCirclesQuery = (limit = 10, timeframe = 7) => {
  return useInfiniteQuery({
    queryKey: ["circles", "trending", limit, timeframe],
    queryFn: ({ pageParam }) => getTrendingCircles(pageParam, limit, timeframe),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.nextCursor
        : undefined;
    },
  });
};

export const useNewCirclesQuery = (limit = 10) => {
  return useInfiniteQuery({
    queryKey: ["circles", "new", limit],
    queryFn: ({ pageParam }) => getNewCircles(pageParam, limit),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.nextCursor
        : undefined;
    },
  });
};

export const useSmallCirclesQuery = (limit = 10, maxMembers = 10) => {
  return useInfiniteQuery({
    queryKey: ["circles", "small", limit, maxMembers],
    queryFn: ({ pageParam }) => getSmallCircles(pageParam, limit, maxMembers),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.nextCursor
        : undefined;
    },
  });
};

export const useSearchCirclesQuery = (
  filters: GroupSearchFilters,
  limit = 10,
  enabled = true,
) => {
  return useInfiniteQuery({
    queryKey: ["circles", "search", filters, limit],
    queryFn: ({ pageParam }) => searchCircles(filters, pageParam, limit),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.nextCursor
        : undefined;
    },
    enabled:
      enabled &&
      ((filters.query?.length ?? 0) > 0 || (filters.tagIds?.length ?? 0) > 0),
  });
};

export const useSuggestionsQuery = (query: string, limit = 10) => {
  return useQuery({
    queryKey: ["circles", "suggestions", query, limit],
    queryFn: () => getSearchSuggestions(query, limit),
    enabled: query.length > 0,
  });
};

export const useSimilarCirclesQuery = (circleId: string, limit = 10) => {
  return useInfiniteQuery({
    queryKey: ["circles", "similar", circleId, limit],
    queryFn: ({ pageParam }) => getSimilarCircles(circleId, pageParam, limit),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.nextCursor
        : undefined;
    },
    enabled: !!circleId,
  });
};

export const useCirclesByCreatorQuery = (creatorId: string, limit = 10) => {
  return useInfiniteQuery({
    queryKey: ["circles", "creator", creatorId, limit],
    queryFn: ({ pageParam }) =>
      getCirclesByCreator(creatorId, pageParam, limit),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.nextCursor
        : undefined;
    },
    enabled: !!creatorId,
  });
};
