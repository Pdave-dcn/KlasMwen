import { useQuery } from "@tanstack/react-query";

import { getQuickStats } from "@/api/circle";

export const useQuickStatsQuery = () => {
  return useQuery({
    queryKey: ["circles", "stats", "quick"],
    queryFn: () => getQuickStats(),
  });
};
