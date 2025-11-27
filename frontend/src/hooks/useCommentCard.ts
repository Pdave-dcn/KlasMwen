import { useParentCommentsQuery } from "@/queries/comment.query";

interface UseCommentCardProps {
  postId: string;
}

export const useCommentCard = ({ postId }: UseCommentCardProps) => {
  const {
    data,
    isLoading,
    error,
    hasNextPage: hasMoreComments,
    fetchNextPage: fetchMoreComments,
    isFetchingNextPage: isFetchingComments,
    refetch,
  } = useParentCommentsQuery(postId);

  const handleRetry = async () => {
    await refetch();
  };

  const comments = data?.pages.flatMap((page) => page?.data) ?? [];
  const totals =
    data?.pages.flatMap((page) => page?.pagination.totalComments) ?? [];
  const totalComments = totals[0];

  return {
    comments,
    totalComments,
    isLoading,
    error,
    hasMoreComments,
    isFetchingComments,
    handlers: {
      handleRetry,
      fetchMoreComments,
    },
  };
};
