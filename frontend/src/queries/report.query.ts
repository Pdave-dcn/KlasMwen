import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  getAllReports,
  getReportReasons,
  getReportStats,
  toggleVisibility,
  updateReportStatus,
  deleteReport,
  createReport,
} from "@/api/report.api";
import type {
  Report,
  ReportsQueryParams,
  ToggleVisibilityRequest,
  UpdateReportStatusRequest,
} from "@/zodSchemas/report.zod";

// export interface UseReportsQueryParams {
//   status?: ReportStatusEnum;
//   postId?: string;
//   commentId?: number;
//   page?: number;
//   limit?: number;
//   reasonId?: number;
// }

// Query Hooks

const useReportsQuery = (filters?: ReportsQueryParams) => {
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

// Mutation Hooks

/**
 * Toggle content visibility (hide/unhide posts or comments)
 */
const useToggleVisibilityMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleVisibility,
    onMutate: async (variables: ToggleVisibilityRequest) => {
      await queryClient.cancelQueries({ queryKey: ["reports", "fetch"] });

      const previousReports = queryClient.getQueriesData({
        queryKey: ["reports", "fetch"],
      });

      queryClient.setQueriesData(
        { queryKey: ["reports", "fetch"] },
        (old: any) => {
          if (!old?.data) return old;

          return {
            ...old,
            data: old.data.map((report: Report) => {
              const isTargetReport =
                (variables.resourceType === "post" &&
                  report.post?.id === variables.resourceId) ||
                (variables.resourceType === "comment" &&
                  report.comment?.id === variables.resourceId);

              if (isTargetReport) {
                return {
                  ...report,
                  isContentHidden: variables.hidden,
                };
              }
              return report;
            }),
          };
        }
      );

      return { previousReports };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousReports) {
        context.previousReports.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      toast.error("Failed to toggle visibility", {
        description: "Please try again later",
      });
    },
    onSuccess: async (_data, variables) => {
      const action = variables.hidden ? "hidden" : "shown";
      const { resourceType } = variables;

      toast.success(`Content ${action}`, {
        description: `The ${resourceType} has been ${action} successfully`,
      });

      await queryClient.invalidateQueries({ queryKey: ["reports", "stats"] });
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["reports", "fetch"] });
    },
  });
};

/**
 * Update report status (PENDING, REVIEWED, DISMISSED)
 */
const useUpdateReportStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: UpdateReportStatusRequest;
    }) => updateReportStatus(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["reports", "fetch"] });

      const previousReports = queryClient.getQueriesData({
        queryKey: ["reports", "fetch"],
      });

      queryClient.setQueriesData(
        { queryKey: ["reports", "fetch"] },
        (old: any) => {
          if (!old?.data) return old;

          return {
            ...old,
            data: old.data.map((report: Report) => {
              if (report.id === id) {
                return {
                  ...report,
                  status: data.status,
                  moderatorNotes: data.moderatorNotes ?? report.moderatorNotes,
                };
              }
              return report;
            }),
          };
        }
      );

      return { previousReports };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousReports) {
        context.previousReports.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      toast.error("Failed to update report status", {
        description: "Please try again later",
      });
    },
    onSuccess: async (_data, variables) => {
      const statusLabel =
        variables.data.status.charAt(0) +
        variables.data.status.slice(1).toLowerCase();

      toast.success("Report updated", {
        description: `Report status changed to ${statusLabel}`,
      });

      await queryClient.invalidateQueries({ queryKey: ["reports", "stats"] });
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["reports", "fetch"] });
    },
  });
};

/**
 * Delete a report
 */
const useDeleteReportMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteReport,
    onMutate: async (reportId: number) => {
      await queryClient.cancelQueries({ queryKey: ["reports", "fetch"] });

      const previousReports = queryClient.getQueriesData({
        queryKey: ["reports", "fetch"],
      });

      queryClient.setQueriesData(
        { queryKey: ["reports", "fetch"] },
        (old: any) => {
          if (!old?.data) return old;

          return {
            ...old,
            data: old.data.filter((report: Report) => report.id !== reportId),
            pagination: {
              ...old.pagination,
              total: old.pagination.total - 1,
            },
          };
        }
      );

      return { previousReports };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousReports) {
        context.previousReports.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      toast.error("Failed to delete report", {
        description: "Please try again later",
      });
    },
    onSuccess: async () => {
      toast.success("Report deleted", {
        description: "The report has been permanently deleted",
      });

      await queryClient.invalidateQueries({ queryKey: ["reports", "stats"] });
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["reports", "fetch"] });
    },
  });
};

/**
 * Create a new report
 */
const useCreateReportMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createReport,
    onSuccess: async () => {
      toast.success("Report submitted", {
        description: "Thank you for helping keep our community safe",
      });

      // Invalidate to refetch reports and stats
      await queryClient.invalidateQueries({ queryKey: ["reports", "fetch"] });
      await queryClient.invalidateQueries({ queryKey: ["reports", "stats"] });
    },
    onError: (_error) => {
      toast.error("Failed to submit report", {
        description: "Please try again later",
      });
    },
  });
};

/**
 * Quick action: Mark report as reviewed
 */
const useMarkReviewedMutation = () => {
  const updateMutation = useUpdateReportStatusMutation();

  return {
    mutate: (reportId: number, notes?: string) => {
      updateMutation.mutate({
        id: reportId,
        data: {
          status: "REVIEWED",
          moderatorNotes: notes,
        },
      });
    },
    isPending: updateMutation.isPending,
    isError: updateMutation.isError,
    isSuccess: updateMutation.isSuccess,
  };
};

/**
 * Quick action: Dismiss report
 */
const useDismissReportMutation = () => {
  const updateMutation = useUpdateReportStatusMutation();

  return {
    mutate: (reportId: number, notes?: string) => {
      updateMutation.mutate({
        id: reportId,
        data: {
          status: "DISMISSED",
          moderatorNotes: notes,
        },
      });
    },
    isPending: updateMutation.isPending,
    isError: updateMutation.isError,
    isSuccess: updateMutation.isSuccess,
  };
};

export {
  useReportsQuery,
  useReportReasonsQuery,
  useReportStatsQuery,
  useToggleVisibilityMutation,
  useUpdateReportStatusMutation,
  useMarkReviewedMutation,
  useDismissReportMutation,
  useDeleteReportMutation,
  useCreateReportMutation,
};
