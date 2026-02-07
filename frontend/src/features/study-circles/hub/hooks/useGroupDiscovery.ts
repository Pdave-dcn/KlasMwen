import { useState, useCallback, useEffect } from "react";

import { useDebouncedValue } from "@/features/search/hooks/useDebouncedValue";
import {
  useRecommendedGroupsQuery,
  useTrendingGroupsQuery,
  useNewGroupsQuery,
  useSmallGroupsQuery,
  useSearchGroupsQuery,
  useSuggestionsQuery,
} from "@/queries/chat";
import type { SearchSuggestion } from "@/zodSchemas/chat.zod";

export type DiscoveryCategory = "popular" | "trending" | "new" | "small";

const PAGE_LIMIT = 9;

export const useGroupDiscovery = () => {
  // Category & search state
  const [activeCategory, setActiveCategory] =
    useState<DiscoveryCategory>("popular");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);

  // Autocomplete
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Debounce search query
  const debouncedQuery = useDebouncedValue(searchQuery, 300);

  // Category-based queries
  const popularQuery = useRecommendedGroupsQuery(PAGE_LIMIT);
  const trendingQuery = useTrendingGroupsQuery(PAGE_LIMIT);
  const newQuery = useNewGroupsQuery(PAGE_LIMIT);
  const smallQuery = useSmallGroupsQuery(PAGE_LIMIT);
  const searchQueryHook = useSearchGroupsQuery(
    debouncedQuery,
    PAGE_LIMIT,
    isSearchActive && debouncedQuery.length > 0,
  );

  // Suggestions query
  const { data: suggestionsData, isLoading: isLoadingSuggestions } =
    useSuggestionsQuery(debouncedQuery, 5);

  const suggestions = suggestionsData ?? [];

  // Show suggestions when query changes and has results
  useEffect(() => {
    if (debouncedQuery.trim() && suggestions.length > 0 && !isSearchActive) {
      setShowSuggestions(true);
    } else if (!debouncedQuery.trim()) {
      setShowSuggestions(false);
    }
  }, [debouncedQuery, suggestions.length, isSearchActive]);

  const handleSearchFocus = () => {
    if (suggestions.length > 0 && searchQuery.trim()) {
      setShowSuggestions(true);
    }
  };

  const handleSearchBlur = () => {
    // Delay hiding suggestions to allow click events to register
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    setSearchQuery(suggestion.name);
    setShowSuggestions(false);
    executeSearch(suggestion.name);
  };

  const handleTagClick = (tag: string) => {
    setSearchQuery(tag);
    executeSearch(tag);
  };

  // Select the active query based on state
  const activeQuery = (() => {
    if (isSearchActive) return searchQueryHook;

    switch (activeCategory) {
      case "trending":
        return trendingQuery;
      case "new":
        return newQuery;
      case "small":
        return smallQuery;
      case "popular":
      default:
        return popularQuery;
    }
  })();

  const {
    data,
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = activeQuery;

  // Flatten groups from all pages
  const groups = data?.pages.flatMap((page) => page.data) ?? [];

  // Actions
  const executeSearch = useCallback((query: string) => {
    if (!query.trim()) return;
    setSearchQuery(query);
    setIsSearchActive(true);
    setShowSuggestions(false);
  }, []);

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      executeSearch(searchQuery);
    },
    [searchQuery, executeSearch],
  );

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setIsSearchActive(false);
    setShowSuggestions(false);
  }, []);

  const handleCategoryChange = useCallback((category: DiscoveryCategory) => {
    setActiveCategory(category);
    setIsSearchActive(false);
    setSearchQuery("");
    setShowSuggestions(false);
  }, []);

  return {
    // State
    activeCategory,
    searchQuery,
    isSearchActive,
    showSuggestions,
    suggestions,
    isLoadingSuggestions,

    // Data
    groups,
    isLoading,
    isError,

    // Actions
    setSearchQuery,
    executeSearch,
    handleSearchSubmit,
    clearSearch,
    handleCategoryChange,
    handleSearchFocus,
    handleSearchBlur,
    handleSuggestionSelect,
    handleTagClick,

    //pagination
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
};
