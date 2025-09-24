import { useNavigate } from "react-router-dom";

import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { Separator } from "@radix-ui/react-dropdown-menu";
import { AlertCircle, MessageCircle, RefreshCw } from "lucide-react";

import { useParentCommentsQuery } from "@/queries/useComment";
import { formatDate } from "@/utils/dateFormatter.util";
import { getInitials } from "@/utils/getInitials.util";

import { Alert, AlertDescription } from "../ui/alert";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Spinner } from "../ui/spinner";

interface CommentCardProps {
  postId?: string;
}

const CommentsLoading = () => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg flex items-center space-x-2">
        <MessageCircle className="w-5 h-5" />
        <div className="w-24 h-5 bg-muted rounded animate-pulse" />
      </CardTitle>
    </CardHeader>
    <CardContent className="flex items-center justify-center space-y-10">
      <Spinner />
    </CardContent>
  </Card>
);

const CommentsError = ({ onRetry }: { error: Error; onRetry: () => void }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg flex items-center space-x-2">
        <MessageCircle className="w-5 h-5" />
        <span>Comments</span>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <div>
            <p className="font-medium">Failed to load comments</p>
            <p className="text-sm mt-1">
              Something went wrong. Please try again.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="ml-4 flex-shrink-0"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    </CardContent>
  </Card>
);

// Empty state component
const CommentsEmpty = () => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <MessageCircle className="w-12 h-12 text-muted-foreground mb-4" />
    <h3 className="font-medium text-lg mb-2">No comments yet</h3>
    <p className="text-sm text-muted-foreground max-w-sm">
      Be the first to share your thoughts on this post!
    </p>
  </div>
);

// Loading button component
const LoadMoreButton = ({
  isLoading,
  onClick,
}: {
  isLoading: boolean;
  onClick: () => void;
}) => (
  <Button
    variant="outline"
    onClick={onClick}
    disabled={isLoading}
    className="w-full mt-6"
  >
    {isLoading ? (
      <>
        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
        Loading more comments...
      </>
    ) : (
      "Load more comments"
    )}
  </Button>
);

const CommentCard = ({ postId }: CommentCardProps) => {
  const {
    data,
    isLoading,
    error,
    hasNextPage: hasMoreComments,
    fetchNextPage: fetchMoreComments,
    isFetchingNextPage: isFetchingComments,
    refetch,
  } = useParentCommentsQuery(postId as string);

  const navigate = useNavigate();

  const comments = data?.pages.flatMap((page) => page?.data) ?? [];
  const totals =
    data?.pages.flatMap((page) => page?.pagination.totalComments) ?? [];
  const totalComments = totals[0];

  const handleUserClick = async (userId: string) => {
    await navigate(`/profile/${userId}`);
  };

  // Loading state
  if (isLoading) {
    return <CommentsLoading />;
  }

  // Error state
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
          <>
            {comments.map((comment, index) => (
              <div key={comment?.id}>
                <div className="flex space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage
                      src={comment?.author.avatar.url ?? ""}
                      alt={comment?.author.username}
                    />
                    <AvatarFallback className="text-xs">
                      {getInitials(comment ? comment.author.username : "")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() =>
                          handleUserClick(comment ? comment.author.id : "")
                        }
                        className="font-medium text-sm p-0 h-auto"
                      >
                        {comment?.author.username}
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(comment ? comment.createdAt : "")}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed">
                      {comment?.content}
                    </p>
                  </div>
                </div>
                {index < comments.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}

            {hasMoreComments && (
              <LoadMoreButton
                isLoading={isFetchingComments}
                onClick={() => fetchMoreComments()}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default CommentCard;
