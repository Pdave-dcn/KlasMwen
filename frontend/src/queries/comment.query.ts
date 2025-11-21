import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createComment,
  deleteComment,
  getParentCommentReplies,
  getPostParentComments,
} from "@/api/comment.api";
import type { CommentCreationData } from "@/zodSchemas/comment.zod";

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

const useCreateCommentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      postId,
      data,
    }: {
      postId: string;
      data: CommentCreationData;
    }) => createComment(postId, data),

    onSuccess: async (_newComment, { postId }) => {
      await queryClient.invalidateQueries({
        queryKey: ["comments"],
      });
      await queryClient.invalidateQueries({ queryKey: ["posts", postId] });
    },
  });
};

const useDeleteCommentMutation = (commentId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteComment(commentId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["comments"],
      });
    },
  });
};

export {
  useParentCommentsQuery,
  useRepliesQuery,
  useCreateCommentMutation,
  useDeleteCommentMutation,
};
