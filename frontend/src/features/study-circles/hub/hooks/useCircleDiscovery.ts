import { useCallback } from "react";

import {
  useDiscoveryCategory,
  type DiscoveryCategory,
} from "./useCircleDiscoveryCategory";
import { useCircleSearch } from "./useCircleSearch";

export const useCircleDiscovery = () => {
  const {
    activeCategory,
    activeQuery: categoryQuery,
    handleCategoryChange: onCategoryChange,
  } = useDiscoveryCategory();

  const {
    searchQuery,
    isSearchActive,
    searchQueryHook,
    suggestions,
    showSuggestions,
    isLoadingSuggestions,
    selectedTags,
    setSearchQuery,
    handleSearchSubmit,
    clearSearch,
    handleSearchFocus,
    handleSearchBlur,
    handleSuggestionSelect,
    handleTagClick,
  } = useCircleSearch();

  // Select active query based on search state
  const activeQuery = isSearchActive ? searchQueryHook : categoryQuery;

  const {
    data,
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = activeQuery;

  const circles = data?.pages.flatMap((page) => page.data) ?? [];

  // Combine category change with search reset
  const handleCategoryChange = useCallback(
    (category: DiscoveryCategory) => {
      clearSearch();
      onCategoryChange(category);
    },
    [clearSearch, onCategoryChange],
  );

  return {
    // Category state
    category: {
      active: activeCategory,
      onChange: handleCategoryChange,
    },

    // Search state & handlers
    search: {
      query: searchQuery,
      isActive: isSearchActive,
      tags: selectedTags,
      suggestions: {
        items: suggestions,
        isVisible: showSuggestions,
        isLoading: isLoadingSuggestions,
      },
      setQuery: setSearchQuery,
      onSubmit: handleSearchSubmit,
      onFocus: handleSearchFocus,
      onBlur: handleSearchBlur,
      onSuggestionSelect: handleSuggestionSelect,
      onTagClick: handleTagClick,
      onClear: clearSearch,
    },

    // Data state
    data: {
      circles,
      isLoading,
      isError,
    },

    // Pagination
    pagination: {
      hasMore: hasNextPage,
      isLoadingMore: isFetchingNextPage,
      loadMore: fetchNextPage,
    },
  };
};
