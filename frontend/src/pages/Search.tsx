import { useState } from "react";

import { Search as SearchIcon, Hash, TrendingUp } from "lucide-react";

import { PostCard } from "@/components/cards/post/PostCard";
import LoadMoreButton from "@/components/LoadMoreButton";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/features/search/components/EmptyState";
import { useDebouncedValue } from "@/features/search/hooks/useDebouncedValue";
import { useSearchQuery } from "@/queries/useSearchQuery";

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebouncedValue(searchQuery, 500);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useSearchQuery({
      searchTerm: debouncedQuery,
      limit: 10,
    });

  const posts = data?.pages.flatMap((page) => page.data) ?? [];
  const totalResults = data?.pages[0]?.meta.resultsFound ?? 0;

  const trendingTags = ["technology", "design", "startup", "ai", "webdev"];

  const handleTagClick = (tag: string) => {
    const tagQuery = `#${tag}`;
    setSearchQuery(tagQuery);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Search Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search posts, #tags, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 pl-11 text-base shadow-sm transition-shadow focus-visible:shadow-md"
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        {/* Trending Tags */}
        {!debouncedQuery && (
          <div className="mb-8 rounded-lg p-6">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Trending Tags</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {trendingTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-background text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground"
                >
                  <Hash className="h-4 w-4" />
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4">
                <div className="flex gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && debouncedQuery && posts.length === 0 && (
          <EmptyState query={debouncedQuery} />
        )}

        {/* Search Results */}
        {!isLoading && posts.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Found {totalResults} result{totalResults !== 1 ? "s" : ""} for "
              {debouncedQuery}"
            </p>

            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}

            {/* Load More Button */}
            {hasNextPage && (
              <div className="flex justify-center">
                <LoadMoreButton
                  isLoading={isFetchingNextPage}
                  onClick={fetchNextPage}
                  variant="ghost"
                />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Search;
