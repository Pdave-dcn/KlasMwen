import { useQuery } from "@tanstack/react-query";

import { getQuickStats } from "@/api/chat";

export const useQuickStatsQuery = () => {
  return useQuery({
    queryKey: ["chat", "stats", "quick"],
    queryFn: () => getQuickStats(),
  });
};
