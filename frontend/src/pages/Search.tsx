/* eslint-disable complexity */
import { useState, useEffect } from "react";

import { useSearchParams } from "react-router-dom";

import { Search, Hash, TrendingUp, X } from "lucide-react";

import { PostCard } from "@/components/cards/post/PostCard";
import LoadMoreButton from "@/components/LoadMoreButton";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/features/search/components/EmptyState";
import { useDebouncedValue } from "@/features/search/hooks/useDebouncedValue";
import { useSearchQuery } from "@/queries/useSearchQuery";
import { usePopularTagsQuery } from "@/queries/useTag";

const SearchPage = () => {
  const { data: mostPopularTags } = usePopularTagsQuery();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") ?? "");
  const [selectedTags, setSelectedTags] = useState<string[]>(() => {
    const tags = searchParams.get("tags");
    return tags ? tags.split(",") : [];
  });

  const debouncedQuery = useDebouncedValue(searchQuery, 500);

  useEffect(() => {
    const params: Record<string, string> = {};

    if (debouncedQuery) {
      params.q = debouncedQuery;
    }

    if (selectedTags.length > 0) {
      params.tags = selectedTags.join(",");
    }

    setSearchParams(params, { replace: true });
  }, [debouncedQuery, selectedTags, setSearchParams]);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useSearchQuery({
      searchTerm: debouncedQuery,
      tagIds: selectedTags,
      limit: 10,
    });

  const posts = data?.pages.flatMap((page) => page.data) ?? [];
  const totalResults = data?.pages[0]?.meta.resultsFound ?? 0;

  const handleTagToggle = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedTags([]);
  };

  const hasActiveFilters = debouncedQuery || selectedTags.length > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Search Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search posts by keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 pl-11 text-base shadow-sm transition-shadow focus-visible:shadow-md"
            />
          </div>

          {/* Selected Tags Display */}
          {selectedTags.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Filtering by:
              </span>
              {selectedTags.map((tagId) => {
                const tag = mostPopularTags?.find(
                  (t) => t.id === parseInt(tagId, 10)
                );
                return tag ? (
                  <button
                    key={tagId}
                    onClick={() => handleTagToggle(tagId)}
                    className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    <Hash className="h-3 w-3" />
                    {tag.name}
                    <X className="h-3 w-3" />
                  </button>
                ) : null;
              })}
              <button
                onClick={clearAllFilters}
                className="text-xs text-muted-foreground underline-offset-4 hover:underline"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        {/* Trending Tags */}
        <div className="mb-8 rounded-lg border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Filter by Tags</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {mostPopularTags?.map((tag) => {
              const isSelected = selectedTags.includes(String(tag.id));
              return (
                <button
                  key={tag.id}
                  onClick={() => handleTagToggle(String(tag.id))}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    isSelected
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  <Hash className="h-4 w-4" />
                  {tag.name}
                </button>
              );
            })}
          </div>
        </div>

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
        {!isLoading && hasActiveFilters && posts.length === 0 && (
          <EmptyState query={debouncedQuery} />
        )}

        {/* Search Results */}
        {!isLoading && posts.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Found {totalResults} result{totalResults !== 1 ? "s" : ""}
              {debouncedQuery && ` for "${debouncedQuery}"`}
              {selectedTags.length > 0 &&
                ` with ${selectedTags.length} tag${
                  selectedTags.length !== 1 ? "s" : ""
                }`}
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

        {/* Initial State - No Filters Applied */}
        {!isLoading && !hasActiveFilters && (
          <div className="text-center py-12">
            <Search className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">Start Searching</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter keywords or select tags to find posts
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default SearchPage;
