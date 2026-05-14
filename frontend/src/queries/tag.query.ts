import { useQuery } from "@tanstack/react-query";

import { getPopularTags, getTags } from "@/api/tag.api";

const ONE_HOUR = 1000 * 60 * 60;
const ONE_DAY = 1000 * 60 * 60 * 24;

const useTagQuery = () => {
  return useQuery({
    queryKey: ["tags"],
    queryFn: getTags,
    // Aggressive caching since tags rarely change
    staleTime: ONE_HOUR, // Consider data fresh for 1 hour
    gcTime: ONE_DAY, // Keep in cache for 24 hours
    refetchOnWindowFocus: false, // Don't refetch when user returns to tab
    refetchOnMount: false, // Don't refetch on component mount if cached
    refetchOnReconnect: false, // Don't refetch on reconnect
    retry: 2, // Retry failed requests twice
  });
};

const usePopularTagsQuery = () => {
  return useQuery({
    queryKey: ["tags", "popular"],
    queryFn: getPopularTags,
  });
};

export { useTagQuery, usePopularTagsQuery };
