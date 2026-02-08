import { useCallback } from "react";

import {
  useDiscoveryCategory,
  type DiscoveryCategory,
} from "./useGroupDiscoveryCategory";
import { useGroupSearch } from "./useGroupSearch";

export const useGroupDiscovery = () => {
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
    setSearchQuery,
    handleSearchSubmit,
    clearSearch,
    handleSearchFocus,
    handleSearchBlur,
    handleSuggestionSelect,
    handleTagClick,
  } = useGroupSearch();

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

  const groups = data?.pages.flatMap((page) => page.data) ?? [];

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
      groups,
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
