import { useInfiniteQuery } from "@tanstack/react-query";

import { searchPosts } from "@/api/search.api";

interface UseSearchQueryOptions {
  searchTerm: string;
  tagIds: string[];
  limit?: number;
  enabled?: boolean;
}

export const useSearchQuery = ({
  searchTerm,
  tagIds,
  limit = 10,
  enabled = true,
}: UseSearchQueryOptions) => {
  return useInfiniteQuery({
    queryKey: ["posts", "search", searchTerm, tagIds],
    queryFn: ({ pageParam }: { pageParam?: string | number }) =>
      searchPosts(searchTerm, tagIds, limit, pageParam as string | undefined),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.nextCursor
        : undefined;
    },
    enabled: enabled && (searchTerm.trim().length > 0 || tagIds.length > 0),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
};
