import { useNavigate } from "react-router-dom";

import { ArrowLeft, TrendingUp, Star, Sparkles, Users } from "lucide-react";

import LoadMoreButton from "@/components/LoadMoreButton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  useGroupDiscovery,
  type DiscoveryCategory,
} from "../../hooks/useGroupDiscovery";

import { DiscoveryHero } from "./DiscoverHero";
import { DiscoveryEmptyState } from "./DiscoveryEmptyState";
import { DiscoveryGridSkeleton } from "./DiscoveryGridSkeleton";
import { GroupDiscoveryCard } from "./GroupDiscoveryCard";

const CATEGORY_CONFIG: Record<
  DiscoveryCategory,
  { label: string; icon: React.ElementType }
> = {
  popular: { label: "Recommended", icon: Star },
  new: { label: "New Arrivals", icon: Sparkles },
  small: { label: "Small Circles", icon: Users },
  trending: { label: "Trending", icon: TrendingUp },
};

export const DiscoverGroupsPage = () => {
  const navigate = useNavigate();

  const {
    activeCategory,
    searchQuery,
    isSearchActive,
    groups,
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    showSuggestions,
    suggestions,
    isLoadingSuggestions,
    fetchNextPage,
    setSearchQuery,
    handleSearchSubmit,
    handleSearchFocus,
    handleSearchBlur,
    handleSuggestionSelect,
    handleTagClick,
    clearSearch,
    handleCategoryChange,
  } = useGroupDiscovery();

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            Failed to load groups
          </h2>
          <p className="text-muted-foreground">Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky back button */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/chat/hub")}
            className="shrink-0 -ml-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="text-sm font-medium text-foreground">
            Back to Hub
          </span>
        </div>
      </div>

      {/* Hero Section */}
      <DiscoveryHero
        searchQuery={searchQuery}
        suggestions={suggestions}
        showSuggestions={showSuggestions}
        isLoadingSuggestions={isLoadingSuggestions}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        onClearSearch={clearSearch}
        onTagClick={handleTagClick}
        onSearchBlur={handleSearchBlur}
        onSearchFocus={handleSearchFocus}
        onSuggestionSelect={handleSuggestionSelect}
      />

      {/* Content area */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Active search indicator OR category tabs */}
        {isSearchActive ? (
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted-foreground">
              Results for{" "}
              <span className="font-semibold text-foreground">
                "{searchQuery}"
              </span>
            </p>
            <Button variant="ghost" size="sm" onClick={clearSearch}>
              Clear search
            </Button>
          </div>
        ) : (
          <Tabs
            value={activeCategory}
            onValueChange={(v) => handleCategoryChange(v as DiscoveryCategory)}
            className="mb-6"
          >
            <TabsList className="w-full grid grid-cols-4 h-auto p-1 bg-muted/60">
              {(Object.keys(CATEGORY_CONFIG) as DiscoveryCategory[]).map(
                (cat) => {
                  const { label, icon: Icon } = CATEGORY_CONFIG[cat];
                  return (
                    <TabsTrigger
                      key={cat}
                      value={cat}
                      className="flex items-center gap-1.5 py-2.5 text-xs sm:text-sm data-[state=active]:shadow-sm"
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{label}</span>
                      <span className="sm:hidden">{label.split(" ")[0]}</span>
                    </TabsTrigger>
                  );
                },
              )}
            </TabsList>
          </Tabs>
        )}

        {/* Groups Grid */}
        {isLoading ? (
          <DiscoveryGridSkeleton count={6} />
        ) : groups.length === 0 ? (
          <DiscoveryEmptyState
            isSearchActive={isSearchActive}
            onClearSearch={clearSearch}
          />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {groups.map((group) => (
                <GroupDiscoveryCard
                  key={group.id}
                  group={group}
                  category={isSearchActive ? undefined : activeCategory}
                />
              ))}
            </div>

            {/* Load More */}
            {hasNextPage && (
              <LoadMoreButton
                onClick={fetchNextPage}
                isLoading={isFetchingNextPage}
                variant="outline"
              />
            )}

            {/* Next-page skeletons */}
            {isFetchingNextPage && (
              <div className="mt-4">
                <DiscoveryGridSkeleton count={3} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
