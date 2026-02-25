import { useRef } from "react";

import { Search, X, Compass } from "lucide-react";

import { Input } from "@/components/ui/input";
import type { SearchSuggestion } from "@/zodSchemas/circle.zod";
import type { PopularTag } from "@/zodSchemas/tag.zod";

import { SearchSuggestionsDropdown } from "./SearchSuggestionsDropdown";
import { TrendingTags } from "./TrendingTags";

interface DiscoveryHeroProps {
  searchQuery: string;
  tags: number[];
  onSearchChange: (query: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onClearSearch: () => void;
  onTagClick: (tag: PopularTag) => void;
  suggestions: SearchSuggestion[];
  showSuggestions: boolean;
  isLoadingSuggestions: boolean;
  onSuggestionSelect: (suggestion: SearchSuggestion) => void;
  onSearchFocus: () => void;
  onSearchBlur: () => void;
}

export function DiscoveryHero({
  searchQuery,
  tags,
  onSearchChange,
  onSearchSubmit,
  onClearSearch,
  onTagClick,
  suggestions,
  showSuggestions,
  isLoadingSuggestions,
  onSuggestionSelect,
  onSearchFocus,
  onSearchBlur,
}: DiscoveryHeroProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative bg-linear-to-b from-primary/5 via-primary/2 to-background border-b border-border">
      <div className="max-w-4xl mx-auto px-4 pt-10 pb-8">
        {/* Title area */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
            <Compass className="w-3.5 h-3.5" />
            Discovery Portal
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3 tracking-tight">
            Find your Study Circle
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-md mx-auto">
            Explore communities of learners, join conversations, and grow
            together.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-xl mx-auto">
          <form onSubmit={onSearchSubmit} className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Search by name, topic, or tag..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={onSearchFocus}
              onBlur={onSearchBlur}
              className="pl-12 pr-12 h-14 text-base rounded-2xl border-border bg-card shadow-sm focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={onClearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
            <SearchSuggestionsDropdown
              suggestions={suggestions}
              isLoading={isLoadingSuggestions}
              onSelect={onSuggestionSelect}
              visible={showSuggestions && searchQuery.length > 0}
            />
          </form>
        </div>

        {/* Trending Tags */}
        <TrendingTags onTagClick={onTagClick} selectedTags={tags} />
      </div>
    </div>
  );
}
