import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { getHomePagePosts, getPostById } from "@/api/post.api";

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

const useSinglePostQuery = (postId: string) => {
  return useQuery({
    queryKey: ["single-post", postId],
    queryFn: () => {
      return getPostById(postId);
    },
  });
};

export { useHomePagePosts, useSinglePostQuery };
