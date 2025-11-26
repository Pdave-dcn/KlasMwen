import { useEffect } from "react";

import { useNavigate } from "react-router-dom";

import { Card, CardContent } from "@/components/ui/card";
import { useCommentCard } from "@/hooks/useCommentCard";
import { useAuthStore } from "@/stores/auth.store";
import { useCommentStore } from "@/stores/comment.store";

import CommentCardHeader from "./CommentCardHeader";
import CommentsEmpty from "./CommentsEmpty";
import CommentsError from "./CommentsError";
import CommentsList from "./CommentsList";
import CommentsLoading from "./CommentsLoading";

interface CommentCardProps {
  postId: string;
}

const CommentCard = ({ postId }: CommentCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const setUser = useCommentStore((s) => s.setUser);
  const setPostId = useCommentStore((s) => s.setPostId);
  const setNavigate = useCommentStore((s) => s.setNavigate);

  useEffect(() => {
    setUser(user);
    setPostId(postId);
    setNavigate(navigate);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, postId, navigate]);

  const {
    comments,
    totalComments,
    isLoading,
    error,
    hasMoreComments,
    isFetchingComments,
    handlers,
  } = useCommentCard({ postId });

  if (!user) return null;

  if (isLoading) {
    return <CommentsLoading />;
  }

  if (error) {
    return <CommentsError error={error} onRetry={handlers.handleRetry} />;
  }

  return (
    <Card>
      <CommentCardHeader totalComments={totalComments} />
      <CardContent className="space-y-4">
        {comments.length === 0 ? (
          <CommentsEmpty />
        ) : (
          <CommentsList
            comments={comments}
            hasMoreComments={hasMoreComments}
            isFetchingComments={isFetchingComments}
            onFetchMore={handlers.fetchMoreComments}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default CommentCard;
