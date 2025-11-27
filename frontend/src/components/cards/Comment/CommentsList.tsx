import LoadMoreButton from "@/components/LoadMoreButton";
import type { Comment } from "@/zodSchemas/comment.zod";

import CommentItem from "./CommentItem";

interface CommentsListProps {
  comments: Comment[];
  hasMoreComments: boolean;
  isFetchingComments: boolean;
  onFetchMore: () => void;
}

const CommentsList = ({
  comments,
  hasMoreComments,
  isFetchingComments,
  onFetchMore,
}: CommentsListProps) => {
  return (
    <div className="flex flex-col gap-3">
      {comments.map((comment, index) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          showSeparator={index < comments.length - 1}
        />
      ))}

      {hasMoreComments && (
        <LoadMoreButton
          isLoading={isFetchingComments}
          onClick={onFetchMore}
          style="mt-6"
        />
      )}
    </div>
  );
};

export default CommentsList;
