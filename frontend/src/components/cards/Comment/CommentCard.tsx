import { useState } from "react";

import { useNavigate } from "react-router-dom";

import { MessageCircle } from "lucide-react";

import CommentForm from "@/components/CommentForm";
import LoadMoreButton from "@/components/LoadMoreButton";
import { useParentCommentsQuery } from "@/queries/useComment";
import { formatTimeAgo } from "@/utils/dateFormatter.util";
import { getInitials } from "@/utils/getInitials.util";

import RepliesList from "../../RepliesList";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Separator } from "../../ui/separator";

import CommentsEmpty from "./CommentsEmpty";
import CommentsError from "./CommentsError";
import CommentsLoading from "./CommentsLoading";

interface CommentCardProps {
  postId: string;
}

const CommentCard = ({ postId }: CommentCardProps) => {
  const {
    data,
    isLoading,
    error,
    hasNextPage: hasMoreComments,
    fetchNextPage: fetchMoreComments,
    isFetchingNextPage: isFetchingComments,
    refetch,
  } = useParentCommentsQuery(postId);

  const [openReplies, setOpenReplies] = useState<Set<number>>(new Set());
  const [openCommentForm, setOpenCommentForm] = useState<Set<number>>(
    new Set()
  );

  const toggleReplies = (commentId: number) => {
    setOpenReplies((prev: Set<number>) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };
  const toggleCommentForm = (commentId: number) => {
    setOpenCommentForm((prev: Set<number>) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  const navigate = useNavigate();

  const comments = data?.pages.flatMap((page) => page?.data) ?? [];
  const totals =
    data?.pages.flatMap((page) => page?.pagination.totalComments) ?? [];
  const totalComments = totals[0];

  const handleUserClick = async (userId: string) => {
    await navigate(`/profile/${userId}`);
  };

  if (isLoading) {
    return <CommentsLoading />;
  }

  if (error) {
    return <CommentsError error={error} onRetry={() => refetch()} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center space-x-2">
          <MessageCircle className="w-5 h-5" />
          <span>Comments ({totalComments ?? 0})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {comments.length === 0 ? (
          <CommentsEmpty />
        ) : (
          <div className="flex flex-col gap-3">
            {comments.map((comment, index) => (
              <div key={comment.id}>
                <div className="flex space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage
                      src={comment.author.avatar.url}
                      alt={comment.author.username}
                    />
                    <AvatarFallback className="text-xs">
                      {getInitials(comment.author.username)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => handleUserClick(comment.author.id)}
                        className="font-medium text-sm p-0 h-auto"
                      >
                        {comment.author.username}
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(comment.createdAt)}
                      </span>
                      <button
                        onClick={() => toggleCommentForm(comment.id)}
                        type="button"
                        className="text-xs text-muted-foreground cursor-pointer hover:underline"
                      >
                        Reply
                      </button>
                    </div>

                    <p className="text-sm leading-relaxed">{comment.content}</p>

                    {openCommentForm.has(comment.id) && (
                      <div className="mt-2">
                        <CommentForm
                          isReply
                          author={comment.author.username}
                          postId={postId}
                          parentId={comment.id}
                        />
                      </div>
                    )}

                    {comment.totalReplies > 0 && (
                      <div className="mt-4">
                        <button
                          className="text-xs text-muted-foreground flex items-center gap-4 hover:cursor-pointer group"
                          onClick={() => toggleReplies(comment.id)}
                        >
                          <span className="h-[1px] w-10 bg-muted-foreground" />
                          <span className="group-hover:underline">
                            {openReplies.has(comment.id)
                              ? "Hide replies"
                              : `View replies (${comment.totalReplies})`}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {openReplies.has(comment.id) && (
                  <RepliesList parentId={comment.id} />
                )}
                {index < comments.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}

            {hasMoreComments && (
              <LoadMoreButton
                isLoading={isFetchingComments}
                onClick={() => fetchMoreComments()}
                style="mt-6"
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CommentCard;
