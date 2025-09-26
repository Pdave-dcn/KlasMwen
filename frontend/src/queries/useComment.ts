import { useInfiniteQuery } from "@tanstack/react-query";

import {
  getParentCommentReplies,
  getPostParentComments,
} from "@/api/comment.api";

const useParentCommentsQuery = (postId: string, limit = 10) => {
  return useInfiniteQuery({
    queryKey: ["comments", postId, "parents"],
    queryFn: ({ pageParam }: { pageParam?: string | number }) => {
      return getPostParentComments(postId, pageParam as number, limit);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.nextCursor
        : undefined;
    },
  });
};

const useRepliesQuery = (parentId: number, limit = 10) => {
  return useInfiniteQuery({
    queryKey: ["comments", parentId, "replies"],
    queryFn: ({ pageParam }: { pageParam?: string | number }) => {
      return getParentCommentReplies(parentId, pageParam as number, limit);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.nextCursor
        : undefined;
    },
  });
};

export { useParentCommentsQuery, useRepliesQuery };
