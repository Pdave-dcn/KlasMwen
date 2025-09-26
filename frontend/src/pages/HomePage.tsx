import { BookOpen } from "lucide-react";

import { PostCard } from "@/components/cards/PostCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
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
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (posts?.pages.every((page) => page.data.length === 0)) {
    return (
      <div className="flex justify-center py-8">
        <Card className="text-center py-12 max-w-md">
          <CardContent>
            <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
            <p className="text-muted-foreground mb-4">
              Start sharing your knowledge and connect with your peers!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="py-8 flex justify-center">
        <div className="w-full max-w-2xl px-4">
          <div className="space-y-6">
            {/* Posts Feed */}
            <div className="space-y-6">
              {posts?.pages.flatMap((page) =>
                page.data.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onLike={(id) => console.log("Like post:", id)}
                    onBookmark={(id) => console.log("Bookmark post:", id)}
                    onComment={(id) => console.log("Comment on post:", id)}
                  />
                ))
              )}
            </div>

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
        </div>
      </div>
    </div>
  );
};

export default HomePage;
