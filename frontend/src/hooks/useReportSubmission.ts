import { useCallback } from "react";

import { toast } from "sonner";

import { useCreateReportMutation } from "@/queries/report.query";
import { useAuthStore } from "@/stores/auth.store";
import { useReportModalStore } from "@/stores/reportModal.store";

interface UseReportSubmissionReturn {
  handleSubmit: (reasonId: number) => void;
  isSubmitting: boolean;
  isError: boolean;
}

/**
 * Hook for handling the submission of a report (e.g., for a post or comment).
 * It manages the submission logic, authentication checks and resource ID validation.
 *
 * @return {*}  {UseReportSubmissionReturn} An object containing:
 * - **handleSubmit**: A function to trigger the report submission. It takes the `reasonId` as an argument.
 * - **isSubmitting**: A boolean indicating if the report submission is currently in progress.
 * - **isError**: A boolean indicating if the last report submission resulted in an error.
 */
export const useReportSubmission = (): UseReportSubmissionReturn => {
  const { user } = useAuthStore();
  const { resourceId, contentType, closeReportModal } = useReportModalStore();
  const createReportMutation = useCreateReportMutation();

  const handleSubmit = useCallback(
    (reasonId: number) => {
      if (!user?.id) {
        toast.error("Authentication required", {
          description: "You must be logged in to submit a report",
        });
        return;
      }

      if (!resourceId || !contentType) {
        console.error("Missing resource information");
        return;
      }

      const reportData = {
        reporterId: user.id,
        reasonId,
        ...(contentType === "post" && typeof resourceId === "string"
          ? { postId: resourceId }
          : {}),
        ...(contentType === "comment" && typeof resourceId === "number"
          ? { commentId: resourceId }
          : {}),
      };

      createReportMutation.mutate(reportData, {
        onSuccess: () => {
          closeReportModal();
        },
      });
    },
    [user, resourceId, contentType, createReportMutation, closeReportModal]
  );

  return {
    handleSubmit,
    isSubmitting: createReportMutation.isPending,
    isError: createReportMutation.isError,
  };
};
