import { useState } from "react";

import { TrendingUp, BookOpen } from "lucide-react";

import { Header } from "@/components/Header";
import { PostCard } from "@/components/PostCard";
import { TagFilter } from "@/components/TagFilter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useHomePagePosts } from "@/queries/usePosts";

const HomePage = () => {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const {
    data: posts,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useHomePagePosts();

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (posts?.pages.every((page) => page.data.length === 0)) {
    <Card className="card-elevated text-center py-12">
      <CardContent>
        <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
        <p className="text-muted-foreground mb-4">
          Start sharing your knowledge and connect with your peers!
        </p>
      </CardContent>
    </Card>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            {/* Tag Filter */}
            <Card className="">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Filter by Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TagFilter
                  selectedTags={selectedTags}
                  onTagToggle={handleTagToggle}
                  onClearAll={() => setSelectedTags([])}
                />
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Filter Info */}
            {selectedTags.length > 0 && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>Showing [number] posts for:</span>
                {selectedTags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

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
      </main>
    </div>
  );
};

export default HomePage;
