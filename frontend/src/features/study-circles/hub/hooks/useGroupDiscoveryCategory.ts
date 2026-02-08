import { useState, useCallback } from "react";

import {
  useRecommendedGroupsQuery,
  useTrendingGroupsQuery,
  useNewGroupsQuery,
  useSmallGroupsQuery,
} from "@/queries/chat";

export type DiscoveryCategory = "popular" | "trending" | "new" | "small";

const PAGE_LIMIT = 9;

/**
 * Manages category-based group discovery.
 * Returns the active category query based on user selection.
 */
export const useDiscoveryCategory = () => {
  const [activeCategory, setActiveCategory] =
    useState<DiscoveryCategory>("popular");

  const popularQuery = useRecommendedGroupsQuery(PAGE_LIMIT);
  const trendingQuery = useTrendingGroupsQuery(PAGE_LIMIT);
  const newQuery = useNewGroupsQuery(PAGE_LIMIT);
  const smallQuery = useSmallGroupsQuery(PAGE_LIMIT);

  /** Returns the query hook for the currently active category. */
  const activeQuery = (() => {
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

  /** Updates the active discovery category. */
  const handleCategoryChange = useCallback((category: DiscoveryCategory) => {
    setActiveCategory(category);
  }, []);

  return {
    activeCategory,
    activeQuery,
    handleCategoryChange,
  };
};
