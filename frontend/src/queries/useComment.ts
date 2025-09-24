import { useInfiniteQuery } from "@tanstack/react-query";

import { getPostParentComments } from "@/api/comment.api";

const useParentCommentsQuery = (postId: string, limit = 10) => {
  return useInfiniteQuery({
    queryKey: ["comments", "parents"],
    queryFn: ({ pageParam }: { pageParam?: string | number }) => {
      return getPostParentComments(postId, pageParam as number, limit);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      return lastPage?.pagination.hasMore
        ? lastPage.pagination.nextCursor
        : undefined;
    },
  });
};

export { useParentCommentsQuery };
