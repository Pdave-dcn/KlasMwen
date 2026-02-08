import { useState, useCallback } from "react";

import { useDebouncedValue } from "@/features/search/hooks/useDebouncedValue";
import { useSearchGroupsQuery } from "@/queries/chat";
import type { SearchSuggestion } from "@/zodSchemas/chat.zod";

import { useSearchSuggestions } from "./useSearchSuggestions";

const PAGE_LIMIT = 9;

/**
 * Manages group search functionality including query state, suggestions, and search execution.
 * Handles debounced search input and suggestion dropdown visibility.
 */
export const useGroupSearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);

  const debouncedQuery = useDebouncedValue(searchQuery, 300);

  const searchQueryHook = useSearchGroupsQuery(
    debouncedQuery,
    PAGE_LIMIT,
    isSearchActive && debouncedQuery.length > 0,
  );

  const {
    suggestions,
    showSuggestions,
    isLoadingSuggestions,
    setShowSuggestions,
  } = useSearchSuggestions(searchQuery, isSearchActive);

  /** Executes a search with the given query. Ignores empty queries. */
  const executeSearch = useCallback(
    (query: string) => {
      if (!query.trim()) return;
      setSearchQuery(query);
      setIsSearchActive(true);
      setShowSuggestions(false);
    },
    [setShowSuggestions],
  );

  /** Handles search form submission. */
  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      executeSearch(searchQuery);
    },
    [searchQuery, executeSearch],
  );

  /** Resets search state and clears the query. */
  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setIsSearchActive(false);
    setShowSuggestions(false);
  }, [setShowSuggestions]);

  /** Shows suggestions dropdown when input is focused and has results. */
  const handleSearchFocus = useCallback(() => {
    if (suggestions.length > 0 && searchQuery.trim()) {
      setShowSuggestions(true);
    }
  }, [suggestions.length, searchQuery, setShowSuggestions]);

  /** Hides suggestions dropdown with a delay to allow click events. */
  const handleSearchBlur = useCallback(() => {
    setTimeout(() => setShowSuggestions(false), 200);
  }, [setShowSuggestions]);

  /** Selects a suggestion and executes search with its name. */
  const handleSuggestionSelect = useCallback(
    (suggestion: SearchSuggestion) => {
      setSearchQuery(suggestion.name);
      setShowSuggestions(false);
      executeSearch(suggestion.name);
    },
    [executeSearch, setShowSuggestions],
  );

  /** Executes search when a tag is clicked. */
  const handleTagClick = useCallback(
    (tag: string) => {
      setSearchQuery(tag);
      executeSearch(tag);
    },
    [executeSearch],
  );

  return {
    searchQuery,
    isSearchActive,
    searchQueryHook,
    suggestions,
    showSuggestions,
    isLoadingSuggestions,
    setSearchQuery,
    executeSearch,
    handleSearchSubmit,
    clearSearch,
    handleSearchFocus,
    handleSearchBlur,
    handleSuggestionSelect,
    handleTagClick,
  };
};
