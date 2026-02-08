import { useState, useEffect } from "react";

import { useDebouncedValue } from "@/features/search/hooks/useDebouncedValue";
import { useSuggestionsQuery } from "@/queries/chat";

/**
 * Manages search suggestions visibility and fetching.
 * Auto-shows suggestions when query has results and user isn't actively searching.
 */
export const useSearchSuggestions = (
  searchQuery: string,
  isSearchActive: boolean,
) => {
  const [showSuggestions, setShowSuggestions] = useState(false);

  const debouncedQuery = useDebouncedValue(searchQuery, 300);

  const { data: suggestionsData, isLoading: isLoadingSuggestions } =
    useSuggestionsQuery(debouncedQuery, 5);

  const suggestions = suggestionsData ?? [];

  /** Auto-show/hide suggestions based on query state and results. */
  useEffect(() => {
    if (debouncedQuery.trim() && suggestions.length > 0 && !isSearchActive) {
      setShowSuggestions(true);
    } else if (!debouncedQuery.trim()) {
      setShowSuggestions(false);
    }
  }, [debouncedQuery, suggestions.length, isSearchActive]);

  return {
    suggestions,
    showSuggestions,
    isLoadingSuggestions,
    setShowSuggestions,
  };
};
