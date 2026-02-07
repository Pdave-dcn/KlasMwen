import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import {
  getChatGroupsForDiscovery,
  getRecommendedGroups,
  getTrendingGroups,
  getNewGroups,
  getSmallGroups,
  searchGroups,
  getSimilarGroups,
  getGroupsByCreator,
  getSearchSuggestions,
} from "@/api/chat";

export const useChatGroupsForDiscoveryQuery = (limit: number = 10) => {
  return useInfiniteQuery({
    queryKey: ["chat", "groups", "discover", limit],
    queryFn: ({ pageParam }) => getChatGroupsForDiscovery(limit, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.nextCursor
        : undefined;
    },
  });
};

export const useRecommendedGroupsQuery = (limit = 5) => {
  return useInfiniteQuery({
    queryKey: ["chat", "groups", "recommended", limit],
    queryFn: ({ pageParam }) => getRecommendedGroups(pageParam, limit),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.nextCursor
        : undefined;
    },
  });
};

export const useTrendingGroupsQuery = (limit = 10, timeframe = 7) => {
  return useInfiniteQuery({
    queryKey: ["chat", "groups", "trending", limit, timeframe],
    queryFn: ({ pageParam }) => getTrendingGroups(pageParam, limit, timeframe),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.nextCursor
        : undefined;
    },
  });
};

export const useNewGroupsQuery = (limit = 10) => {
  return useInfiniteQuery({
    queryKey: ["chat", "groups", "new", limit],
    queryFn: ({ pageParam }) => getNewGroups(pageParam, limit),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.nextCursor
        : undefined;
    },
  });
};

export const useSmallGroupsQuery = (limit = 10, maxMembers = 10) => {
  return useInfiniteQuery({
    queryKey: ["chat", "groups", "small", limit, maxMembers],
    queryFn: ({ pageParam }) => getSmallGroups(pageParam, limit, maxMembers),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.nextCursor
        : undefined;
    },
  });
};

export const useSearchGroupsQuery = (
  query: string,
  limit = 10,
  enabled = true,
) => {
  return useInfiniteQuery({
    queryKey: ["chat", "groups", "search", query, limit],
    queryFn: ({ pageParam }) => searchGroups(query, pageParam, limit),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.nextCursor
        : undefined;
    },
    enabled: enabled && query.length > 0,
  });
};

export const useSuggestionsQuery = (query: string, limit = 10) => {
  return useQuery({
    queryKey: ["chat", "groups", "suggestions", query, limit],
    queryFn: () => getSearchSuggestions(query, limit),
    enabled: query.length > 0,
  });
};

export const useSimilarGroupsQuery = (chatGroupId: string, limit = 10) => {
  return useInfiniteQuery({
    queryKey: ["chat", "groups", "similar", chatGroupId, limit],
    queryFn: ({ pageParam }) => getSimilarGroups(chatGroupId, pageParam, limit),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.nextCursor
        : undefined;
    },
    enabled: !!chatGroupId,
  });
};

export const useGroupsByCreatorQuery = (creatorId: string, limit = 10) => {
  return useInfiniteQuery({
    queryKey: ["chat", "groups", "creator", creatorId, limit],
    queryFn: ({ pageParam }) => getGroupsByCreator(creatorId, pageParam, limit),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.nextCursor
        : undefined;
    },
    enabled: !!creatorId,
  });
};
