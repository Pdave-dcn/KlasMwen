import { CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth.store";
import type { ReportStatusEnum } from "@/zodSchemas/report.zod";

export const ReportActions = ({
  localStatus,
  localIsHidden,
  onMarkReviewed,
  onDismiss,
  onToggleHidden,
}: {
  localStatus: string;
  localIsHidden: boolean;
  onMarkReviewed: (status: ReportStatusEnum) => void;
  onDismiss: (status: ReportStatusEnum) => void;
  onToggleHidden: () => void;
}) => {
  const { isGuest } = useAuthStore();

  return (
    <div className="flex gap-2 border-t pt-4">
      <Button
        onClick={() => onMarkReviewed("REVIEWED")}
        className="flex-1"
        disabled={localStatus === "REVIEWED" || isGuest}
      >
        <CheckCircle className="mr-2 h-4 w-4" />
        Mark Reviewed
      </Button>
      <Button
        onClick={() => onDismiss("DISMISSED")}
        variant="outline"
        className="flex-1"
        disabled={localStatus === "DISMISSED" || isGuest}
      >
        <XCircle className="mr-2 h-4 w-4" />
        Dismiss
      </Button>
      <Button onClick={onToggleHidden} variant="outline" disabled={isGuest}>
        {localIsHidden ? (
          <>
            <Eye className="mr-2 h-4 w-4" />
            Unhide
          </>
        ) : (
          <>
            <EyeOff className="mr-2 h-4 w-4" />
            Hide
          </>
        )}
      </Button>
    </div>
  );
};
