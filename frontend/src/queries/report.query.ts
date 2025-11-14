import { useQuery } from "@tanstack/react-query";

import {
  getAllReports,
  getReportReasons,
  getReportStats,
} from "@/api/report.api";
import type { ReportStatusEnum } from "@/zodSchemas/report.zod";

export interface UseReportsQueryParams {
  status?: ReportStatusEnum;
  postId?: string;
  commentId?: number;
  page?: number;
  limit?: number;
  reasonId?: number;
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

const useReportReasonsQuery = () => {
  return useQuery({
    queryKey: ["reports", "reasons"],
    queryFn: getReportReasons,
  });
};

const useReportStatsQuery = () => {
  return useQuery({
    queryKey: ["reports", "stats"],
    queryFn: getReportStats,
  });
};

export { useReportsQuery, useReportReasonsQuery, useReportStatsQuery };
