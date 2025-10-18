import { useInfiniteQuery } from "@tanstack/react-query";

import { searchPostsByTerm } from "@/api/search.api";

interface UseSearchQueryOptions {
  searchTerm: string;
  limit?: number;
  enabled?: boolean;
}

export const useSearchQuery = ({
  searchTerm,
  limit = 10,
  enabled = true,
}: UseSearchQueryOptions) => {
  return useInfiniteQuery({
    queryKey: ["posts", "search", searchTerm],
    queryFn: ({ pageParam }: { pageParam?: string | number }) =>
      searchPostsByTerm(searchTerm, limit, pageParam as string | undefined),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.nextCursor
        : undefined;
    },
    enabled: enabled && searchTerm.trim().length > 0,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
};
