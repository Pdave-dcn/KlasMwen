import { useNavigate } from "react-router-dom";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { useRepliesQuery } from "@/queries/useComment";
import { formatTimeAgo } from "@/utils/dateFormatter.util";
import { getInitials } from "@/utils/getInitials.util";

import LoadMoreButton from "./LoadMoreButton";

interface RepliesListProps {
  parentId: number;
}

const RepliesList = ({ parentId }: RepliesListProps) => {
  const {
    data,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
    error,
  } = useRepliesQuery(parentId);

  const navigate = useNavigate();

  const replies = data?.pages.flatMap((p) => p.data) ?? [];

  const handleUserClick = async (userId: string) => {
    await navigate(`/profile/${userId}`);
  };

  if (isLoading) return <Spinner />;
  if (error)
    return (
      <div>
        <p className="text-sm text-red-500">Failed to load replies</p>
        <Button onClick={() => refetch}>Retry</Button>
      </div>
    );

  return (
    <div className="ml-10 mt-2 flex flex-col gap-3">
      {replies.map((reply, idx) => (
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
                  type="button"
                  className="text-xs text-muted-foreground cursor-pointer hover:underline"
                >
                  Reply
                </button>
              </div>
              <p className="text-sm leading-relaxed">{reply.content}</p>
            </div>
          </div>
          {idx < replies.length - 1 && <Separator className="mt-2" />}
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
  );
};

export default RepliesList;
