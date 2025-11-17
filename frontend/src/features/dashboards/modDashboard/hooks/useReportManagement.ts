import { useCallback } from "react";

import {
  useToggleVisibilityMutation,
  useMarkReviewedMutation,
  useDismissReportMutation,
  useUpdateReportStatusMutation,
  useDeleteReportMutation,
} from "@/queries/report.query";
import type { Report, ReportStatusEnum } from "@/zodSchemas/report.zod";

/**
 * Custom hook to manage report-related operations
 * Encapsulates all business logic for report mutations and handlers
 */
export const useReportManagement = () => {
  // Initialize all mutations
  const toggleVisibilityMutation = useToggleVisibilityMutation();
  const markReviewedMutation = useMarkReviewedMutation();
  const dismissReportMutation = useDismissReportMutation();
  const updateStatusMutation = useUpdateReportStatusMutation();
  const deleteReportMutation = useDeleteReportMutation();

  /**
   * Helper function to extract resource ID from report
   * Handles both post and comment types
   */
  const getResourceId = useCallback((report: Report) => {
    return report.contentType === "post" ? report.post?.id : report.comment?.id;
  }, []);

  /**
   * Toggle visibility of reported content (hide/unhide)
   * @param report - The report containing the content to toggle
   */
  const handleToggleHidden = useCallback(
    (report: Report) => {
      const resourceType = report.contentType;
      const resourceId = getResourceId(report);

      if (!resourceId) {
        console.error("Resource ID not found for report:", report.id);
        return;
      }

      toggleVisibilityMutation.mutate({
        resourceType,
        resourceId,
        hidden: !report.isContentHidden,
      });
    },
    [toggleVisibilityMutation, getResourceId]
  );

  /**
   * Mark a report as reviewed
   * @param reportId - ID of the report to mark as reviewed
   */
  const handleMarkReviewed = useCallback(
    (reportId: number) => {
      markReviewedMutation.mutate(reportId);
    },
    [markReviewedMutation]
  );

  /**
   * Dismiss a report (mark as not requiring action)
   * @param reportId - ID of the report to dismiss
   */
  const handleDismiss = useCallback(
    (reportId: number) => {
      dismissReportMutation.mutate(reportId);
    },
    [dismissReportMutation]
  );

  /**
   * Update report status with optional moderator notes
   * @param reportId - ID of the report to update
   * @param status - New status for the report
   * @param notes - Optional moderator notes
   */
  const handleUpdateStatus = useCallback(
    (reportId: number, status: ReportStatusEnum, notes?: string) => {
      updateStatusMutation.mutate({
        id: reportId,
        data: {
          status,
          moderatorNotes: notes,
        },
      });
    },
    [updateStatusMutation]
  );

  /**
   * Update only the moderator notes for a report
   * Preserves existing status
   * @param report - The report to update
   * @param notes - New moderator notes
   */
  const handleUpdateNotes = useCallback(
    (report: Report, notes: string) => {
      updateStatusMutation.mutate({
        id: report.id,
        data: {
          status: report.status,
          moderatorNotes: notes,
        },
      });
    },
    [updateStatusMutation]
  );

  /**
   * Permanently delete a report
   * This action cannot be undone
   * @param reportId - ID of the report to delete
   */
  const handleDelete = useCallback(
    (reportId: number) => {
      deleteReportMutation.mutate(reportId);
    },
    [deleteReportMutation]
  );

  // Check if any mutation is currently in progress
  const isMutating =
    toggleVisibilityMutation.isPending ||
    markReviewedMutation.isPending ||
    dismissReportMutation.isPending ||
    updateStatusMutation.isPending ||
    deleteReportMutation.isPending;

  return {
    // Handler functions
    handlers: {
      handleToggleHidden,
      handleMarkReviewed,
      handleDismiss,
      handleUpdateStatus,
      handleUpdateNotes,
      handleDelete,
    },
    // Mutation states for granular control if needed
    mutations: {
      toggleVisibility: toggleVisibilityMutation,
      markReviewed: markReviewedMutation,
      dismissReport: dismissReportMutation,
      updateStatus: updateStatusMutation,
      deleteReport: deleteReportMutation,
    },
    // Aggregated loading state
    isMutating,
  };
};
