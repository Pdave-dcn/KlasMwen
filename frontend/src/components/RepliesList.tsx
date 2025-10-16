import { useState } from "react";

import { useNavigate } from "react-router-dom";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useRepliesQuery } from "@/queries/useComment";
import { formatTimeAgo } from "@/utils/dateFormatter.util";
import { getInitials } from "@/utils/getInitials.util";

import CommentForm from "./CommentForm";
import LoadMoreButton from "./LoadMoreButton";
import { Separator } from "./ui/separator";

interface RepliesListProps {
  parentId: number;
  postId: string;
  depth?: number;
}

const RepliesList = ({ parentId, postId }: RepliesListProps) => {
  const [openCommentForm, setOpenCommentForm] = useState<Set<number>>(
    new Set()
  );
  const toggleCommentForm = (commentId: number) => {
    setOpenCommentForm((prev) => {
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

  const {
    data,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
    error,
  } = useRepliesQuery(parentId);

  const replies = data?.pages.flatMap((p) => p.data) ?? [];

  const handleUserClick = async (userId: string) => {
    await navigate(`/profile/${userId}`);
  };

  if (isLoading) return <Spinner />;

  if (error)
    return (
      <div>
        <p className="text-sm text-red-500">Failed to load replies</p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );

  return (
    <div className="ml-10">
      <div className="mt-2 flex flex-col gap-3">
        {replies.map((reply, index) => (
          <div key={reply.id}>
            <div className="flex space-x-3">
              <Avatar className="w-7 h-7">
                <AvatarImage src={reply.author.avatar.url} />
                <AvatarFallback className="text-xs">
                  {getInitials(reply.author.username)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-1">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="link"
                    size="sm"
                    className="font-medium text-sm"
                    onClick={() => handleUserClick(reply.author.id)}
                  >
                    {reply.author.username}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {formatTimeAgo(reply.createdAt)}
                  </span>
                  <button
                    onClick={() => toggleCommentForm(reply.id)}
                    type="button"
                    className="text-xs text-muted-foreground cursor-pointer hover:underline"
                  >
                    Reply
                  </button>
                </div>

                <div className="flex items-center space-x-1">
                  {reply.mentionedUser && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() =>
                        handleUserClick(reply.mentionedUser?.id ?? "")
                      }
                    >
                      @{reply.mentionedUser.username}
                    </Button>
                  )}
                  <p className="text-sm leading-relaxed">{reply.content}</p>
                </div>

                {openCommentForm.has(reply.id) && (
                  <div className="mt-2">
                    <CommentForm
                      isReply
                      author={reply.author.username}
                      postId={postId}
                      parentId={reply.id}
                      onSubmitStart={() => toggleCommentForm(reply.id)}
                    />
                  </div>
                )}
              </div>
            </div>
            {index < replies.length - 1 && <Separator className="mt-2" />}
          </div>
        ))}

        {hasNextPage && (
          <LoadMoreButton
            variant="outline"
            onClick={fetchNextPage}
            isLoading={isFetchingNextPage}
          />
        )}
      </div>
    </div>
  );
};

export default RepliesList;
