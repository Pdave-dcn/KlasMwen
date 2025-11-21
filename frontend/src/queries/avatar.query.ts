import { useInfiniteQuery } from "@tanstack/react-query";

import { getAvatars as fetchAvailableAvatars } from "@/api/avatar.api";

const useAvatars = (limit = 10) => {
  return useInfiniteQuery({
    queryKey: ["avatars"],
    queryFn: ({ pageParam }: { pageParam?: string | number }) => {
      return fetchAvailableAvatars(pageParam, limit);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.nextCursor
        : undefined;
    },
  });
};

export { useAvatars };
