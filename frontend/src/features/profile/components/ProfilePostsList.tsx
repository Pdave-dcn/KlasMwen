import { PostCard } from "@/components/cards/PostCard";
import LoadMoreButton from "@/components/LoadMoreButton";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import type { Post } from "@/zodSchemas/post.zod";

import type {
  InfiniteData,
  InfiniteQueryObserverResult,
} from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";

type PostsResponse = {
  data: Post[];
};

interface EmptyStateConfig {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface ProfilePostsListProps {
  posts: InfiniteData<PostsResponse> | undefined;
  isLoading: boolean;
  error: Error | null;
  hasNextPage: boolean;
  fetchNextPage: () => Promise<
    InfiniteQueryObserverResult<InfiniteData<PostsResponse>>
  >;
  isFetchingNextPage: boolean;
  loadingText: string;
  errorTitle: string;
  emptyState: EmptyStateConfig;
  showBookmarkAction?: boolean;
}

const ProfilePostsList = ({
  posts,
  isLoading,
  error,
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage,
  loadingText,
  errorTitle,
  emptyState,
  showBookmarkAction = true,
}: ProfilePostsListProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Spinner />
          <p className="text-sm text-muted-foreground">{loadingText}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">{errorTitle}</h1>
          <p className="text-muted-foreground mt-2">
            Something went wrong. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  if (posts?.pages.every((page) => page.data.length === 0)) {
    const { icon: Icon, title, description } = emptyState;
    return (
      <Card className="p-8 text-center">
        <Icon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4 flex flex-col items-center">
      {posts?.pages.flatMap((page) =>
        page.data.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onLike={(postId) => console.log("Like post:", postId)}
            onComment={(postId) => console.log("Comment on post:", postId)}
            {...(showBookmarkAction && {
              onBookmark: (postId) => console.log("Bookmark post:", postId),
            })}
          />
        ))
      )}

      {/* Load More button */}
      {hasNextPage && (
        <div className="flex justify-center">
          <LoadMoreButton
            onClick={fetchNextPage}
            isLoading={isFetchingNextPage}
            variant="ghost"
          />
        </div>
      )}
    </div>
  );
};

export default ProfilePostsList;
