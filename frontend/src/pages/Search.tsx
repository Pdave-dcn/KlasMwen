import { useState, useEffect } from "react";

import { useSearchParams } from "react-router-dom";

import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import SearchContent from "@/features/search/components/SearchContent";
import SelectedTagsBar from "@/features/search/components/SelectedTagsBar";
import TrendingTagsSection from "@/features/search/components/TrendingTagsSection";
import { useDebouncedValue } from "@/features/search/hooks/useDebouncedValue";
import { useSearchQuery } from "@/queries/search.query";
import { usePopularTagsQuery } from "@/queries/tag.query";

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

          <SelectedTagsBar
            selectedTags={selectedTags}
            mostPopularTags={mostPopularTags ?? []}
            onTagToggle={handleTagToggle}
            onClearAll={clearAllFilters}
          />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        <TrendingTagsSection
          tags={mostPopularTags ?? []}
          selectedTags={selectedTags}
          onTagToggle={handleTagToggle}
        />

        <SearchContent
          isLoading={isLoading}
          hasActiveFilters={hasActiveFilters}
          posts={posts}
          debouncedQuery={debouncedQuery}
          totalResults={totalResults}
          selectedTags={selectedTags}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={fetchNextPage}
        />
      </main>
    </div>
  );
};

export default SearchPage;
