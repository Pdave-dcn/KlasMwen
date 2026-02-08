import { useNavigate } from "react-router-dom";

import { ArrowLeft, TrendingUp, Star, Sparkles, Users } from "lucide-react";

import LoadMoreButton from "@/components/LoadMoreButton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useGroupDiscovery } from "../../hooks/useGroupDiscovery";

import { DiscoveryHero } from "./DiscoverHero";
import { DiscoveryEmptyState } from "./DiscoveryEmptyState";
import { DiscoveryGridSkeleton } from "./DiscoveryGridSkeleton";
import { GroupDiscoveryCard } from "./GroupDiscoveryCard";

import type { DiscoveryCategory } from "../../hooks/useGroupDiscoveryCategory";

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
  const { category, search, data, pagination } = useGroupDiscovery();

  if (data.isError) {
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
        searchQuery={search.query}
        suggestions={search.suggestions.items}
        showSuggestions={search.suggestions.isVisible}
        isLoadingSuggestions={search.suggestions.isLoading}
        onSearchChange={search.setQuery}
        onSearchSubmit={search.onSubmit}
        onClearSearch={search.onClear}
        onTagClick={search.onTagClick}
        onSearchBlur={search.onBlur}
        onSearchFocus={search.onFocus}
        onSuggestionSelect={search.onSuggestionSelect}
      />

      {/* Content area */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Active search indicator OR category tabs */}
        {search.isActive ? (
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted-foreground">
              Results for{" "}
              <span className="font-semibold text-foreground">
                "{search.query}"
              </span>
            </p>
            <Button variant="ghost" size="sm" onClick={search.onClear}>
              Clear search
            </Button>
          </div>
        ) : (
          <Tabs
            value={category.active}
            onValueChange={(v) => category.onChange(v as DiscoveryCategory)}
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
        {data.isLoading ? (
          <DiscoveryGridSkeleton count={6} />
        ) : data.groups.length === 0 ? (
          <DiscoveryEmptyState
            isSearchActive={search.isActive}
            onClearSearch={search.onClear}
          />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.groups.map((group) => (
                <GroupDiscoveryCard
                  key={group.id}
                  group={group}
                  category={search.isActive ? undefined : category.active}
                />
              ))}
            </div>

            {/* Load More */}
            {pagination.hasMore && (
              <LoadMoreButton
                onClick={pagination.loadMore}
                isLoading={pagination.isLoadingMore}
                variant="outline"
              />
            )}

            {/* Next-page skeletons */}
            {pagination.isLoadingMore && (
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
