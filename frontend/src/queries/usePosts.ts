import { useInfiniteQuery } from "@tanstack/react-query";

import { getActiveUserPosts, getUserPosts } from "@/api/posts.api";

const usePosts = (userId?: string, limit = 10) => {
  return useInfiniteQuery({
    queryKey: userId ? ["posts", userId] : ["me-posts"],
    queryFn: ({ pageParam }: { pageParam?: string | number }) => {
      return userId
        ? getUserPosts(userId, pageParam, limit)
        : getActiveUserPosts(pageParam, limit);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.nextCursor
        : undefined;
    },
  });
};

export default usePosts;
