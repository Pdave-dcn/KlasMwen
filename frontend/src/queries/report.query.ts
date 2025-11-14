import { useQuery } from "@tanstack/react-query";

import { getAllReports } from "@/api/report.api";
import type { ReportStatusEnum } from "@/zodSchemas/report.zod";

export interface UseReportsQueryParams {
  status?: ReportStatusEnum;
  postId?: string;
  commentId?: number;
  page?: number;
  limit?: number;
  reason?: any;
}

const useReportsQuery = (filters?: UseReportsQueryParams) => {
  const page = filters?.page ?? 1;

  return useQuery({
    queryKey: ["reports", "fetch", filters],
    queryFn: () =>
      getAllReports({
        ...filters,
        page,
      }),
  });
};

export { useReportsQuery };
