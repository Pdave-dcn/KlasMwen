import { BookOpen } from "lucide-react";

import PostCard from "@/components/cards/post/PostCard";
import PostCardSkeleton from "@/components/cards/post/PostCardSkeleton";
import LoadMoreButton from "@/components/LoadMoreButton";
import { Card, CardContent } from "@/components/ui/card";
import { useHomePagePosts } from "@/queries/usePosts";

const HomePage = () => {
  const {
    data: posts,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useHomePagePosts();

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="py-8 flex justify-center">
          <div className="w-full max-w-2xl px-4">
            <div className="space-y-6">
              {[1, 2, 3, 4].map((i) => (
                <PostCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (posts?.pages.every((page) => page.data.length === 0)) {
    return (
      <main className="flex justify-center py-8">
        <Card className="text-center py-12 max-w-md">
          <CardContent>
            <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
            <p className="text-muted-foreground mb-4">
              Start sharing your knowledge and connect with your peers!
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="py-8 flex justify-center">
        <div className="w-full max-w-2xl px-4">
          <div className="space-y-6">
            {/* Posts Feed */}
            <div className="space-y-6">
              {posts?.pages.flatMap((page) =>
                page.data.map((post) => <PostCard key={post.id} post={post} />)
              )}
            </div>

            {/* Load More button */}
            {hasNextPage && (
              <div className="flex justify-center">
                <LoadMoreButton
                  isLoading={isFetchingNextPage}
                  onClick={fetchNextPage}
                  variant="ghost"
                  style="max-w-xs"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default HomePage;
