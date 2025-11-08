import { useNavigate, useParams } from "react-router-dom";

import { MessageSquare } from "lucide-react";

import LoadMoreButton from "@/components/LoadMoreButton";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useProfileComments } from "@/queries/useProfile";

import ProfileCommentCard from "../ProfileCommentCard";

const ProfileReplies = () => {
  const { id: userId } = useParams();
  const navigate = useNavigate();
  const {
    data: comments,
    isLoading,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useProfileComments(userId as string);

  const handleUserClick = async (userId: string) => {
    await navigate(`/profile/${userId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Spinner />
          <p className="text-sm text-muted-foreground">Loading comments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">
            Error loading comments
          </h1>
          <p className="text-muted-foreground mt-2">
            Something went wrong. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  if (comments?.pages.every((page) => page?.data.length === 0)) {
    return (
      <Card className="p-8 text-center">
        <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          No replies yet
        </h3>
        <p className="text-muted-foreground">
          User replies and comments will appear here.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center">
        {comments?.pages.flatMap((page) =>
          page?.data.map((comment) => (
            <ProfileCommentCard
              key={comment.id}
              comment={comment}
              onUserClick={handleUserClick}
            />
          ))
        )}
      </div>

      {/* Load More button */}
      {hasNextPage && (
        <div className="flex justify-center">
          <LoadMoreButton
            variant="ghost"
            onClick={fetchNextPage}
            isLoading={isFetchingNextPage}
            style="max-w-xs"
          />
        </div>
      )}
    </div>
  );
};

export default ProfileReplies;
