import { useInfiniteQuery } from "@tanstack/react-query";

import {
  getHomePagePosts,
  getActiveUserPosts,
  getUserPosts,
} from "@/api/post.api";

const useHomePagePosts = (limit = 10) => {
  return useInfiniteQuery({
    queryKey: ["home-posts"],
    queryFn: ({ pageParam }: { pageParam?: string | number }) => {
      return getHomePagePosts(pageParam, limit);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.nextCursor
        : undefined;
    },
  });
};

const useProfilePosts = (userId?: string, limit = 10) => {
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

export { useHomePagePosts, useProfilePosts };
