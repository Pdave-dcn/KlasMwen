import { useState, useCallback } from "react";

import { useDebouncedValue } from "@/features/search/hooks/useDebouncedValue";
import { useSearchGroupsQuery } from "@/queries/chat";
import type { SearchSuggestion } from "@/zodSchemas/chat.zod";
import type { PopularTag } from "@/zodSchemas/tag.zod";

import { useSearchSuggestions } from "./useSearchSuggestions";

const PAGE_LIMIT = 9;

/**
 * Manages group search functionality including query state, suggestions, and search execution.
 * Handles debounced search input, tag filtering, and suggestion dropdown visibility.
 */
export const useGroupSearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [isSearchActive, setIsSearchActive] = useState(false);

  const debouncedQuery = useDebouncedValue(searchQuery, 300);

  // Activate search when either query or tags change
  const shouldEnableSearch =
    isSearchActive && (debouncedQuery.length > 0 || selectedTags.length > 0);

  const searchQueryHook = useSearchGroupsQuery(
    {
      query: debouncedQuery || undefined,
      tagIds: selectedTags.length > 0 ? selectedTags : undefined,
    },
    PAGE_LIMIT,
    shouldEnableSearch,
  );

  const {
    suggestions,
    showSuggestions,
    isLoadingSuggestions,
    setShowSuggestions,
  } = useSearchSuggestions(searchQuery, isSearchActive);

  /** Executes a search with current query and tags state. */
  const executeSearch = useCallback(() => {
    // Allow search if either query or tags are provided
    if (!searchQuery.trim() && selectedTags.length === 0) return;

    setIsSearchActive(true);
    setShowSuggestions(false);
  }, [searchQuery, selectedTags, setShowSuggestions]);

  /** Handles search form submission. */
  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      executeSearch();
    },
    [executeSearch],
  );

  /** Resets search state and clears the query. */
  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setIsSearchActive(false);
    setShowSuggestions(false);
    setSelectedTags([]);
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
      setIsSearchActive(true);
    },
    [setShowSuggestions],
  );

  /** Toggles a tag selection and triggers search if already active. */
  const handleTagClick = useCallback(
    (tag: PopularTag) => {
      const tagId = tag.id;

      setSelectedTags((prev) => {
        const newTags = prev.includes(tagId)
          ? prev.filter((id) => id !== tagId)
          : [...prev, tagId];

        return newTags;
      });

      // Auto-trigger search when tag is clicked
      if (!isSearchActive) {
        setIsSearchActive(true);
      }
    },
    [isSearchActive],
  );

  return {
    searchQuery,
    selectedTags,
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
    setSelectedTags,
  };
};
