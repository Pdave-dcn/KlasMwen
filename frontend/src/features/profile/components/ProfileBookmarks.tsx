import { MessageSquare } from "lucide-react";

import { PostCard } from "@/components/PostCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useProfileBookmarks } from "@/queries/usePosts";

const ProfileBookmarks = () => {
  const {
    data: posts,
    isLoading,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useProfileBookmarks();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Spinner />
          <p className="text-sm text-muted-foreground">
            Loading saved posts...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">
            Error loading saved posts
          </h1>
          <p className="text-muted-foreground mt-2">
            Something went wrong. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  if (posts?.pages.every((page) => page.data.length === 0)) {
    return (
      <Card className="p-8 text-center">
        <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          No saved posts yet
        </h3>
        <p className="text-muted-foreground">
          Save posts to read them later or reference them for your studies
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {posts?.pages.flatMap((page) =>
        page.data.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onLike={(postId) => console.log("Like post:", postId)}
            onComment={(postId) => console.log("Comment on post:", postId)}
          />
        ))
      )}

      {/* Load More button */}
      {hasNextPage && (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "Loading..." : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProfileBookmarks;
