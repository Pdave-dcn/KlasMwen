import { useEffect, useState } from "react";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/stores/auth.store";
import type { Report, ReportStatusEnum } from "@/zodSchemas/report.zod";

import { getStatusBadge, formatDate } from "../../helpers/reportModalHelpers";

import { ContentInfo } from "./ContentInfo";
import { DeleteDialog } from "./DeleteDialog";
import { ReportActions } from "./ReportActions";
import { ReportControls } from "./ReportControls";
import { ReporterInfo } from "./ReporterInfo";
import { ReportReason } from "./ReportReason";

interface ReportModalProps {
  report: Report | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (reportId: number, status: ReportStatusEnum) => void;
  onToggleHidden: (report: Report) => void;
  onUpdateNotes: (report: Report, notes: string) => void;
  onDelete: (reportId: number) => void;
}

export const ReportModal = ({
  report,
  isOpen,
  onClose,
  onUpdateStatus,
  onToggleHidden,
  onUpdateNotes,
  onDelete,
}: ReportModalProps) => {
  const [localNotes, setLocalNotes] = useState("");
  const [localStatus, setLocalStatus] = useState<ReportStatusEnum>("PENDING");
  const [localIsHidden, setLocalIsHidden] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { isGuest } = useAuthStore();

  // sync local state when report changes (same deps as original)
  useEffect(() => {
    if (report) {
      setLocalNotes(report.moderatorNotes ?? "");
      setLocalStatus(report.status);
      setLocalIsHidden(report.isContentHidden);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    report?.id,
    report?.moderatorNotes,
    report?.status,
    report?.isContentHidden,
  ]);

  if (!report) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>No Report Selected</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  // Handlers (kept same semantics)
  const handleSaveNotes = () => {
    onUpdateNotes(report, localNotes);
  };

  const handleStatusChange = (status: ReportStatusEnum) => {
    setLocalStatus(status);
    onUpdateStatus(report.id, status);
  };

  const handleToggleHidden = () => {
    setLocalIsHidden(!localIsHidden); // optimistic update
    onToggleHidden(report);
  };

  const handleDeleteConfirm = () => {
    onDelete(report.id);
    setShowDeleteDialog(false);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose} data-testid="report-modal">
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              Report Details - {`RPT-${report.id}`}
              {getStatusBadge(localStatus)}
            </DialogTitle>
            <DialogDescription>
              Submitted on {formatDate(report.createdAt)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <ReporterInfo report={report} />

            <ContentInfo report={report} isHidden={localIsHidden} />

            <ReportReason report={report} />

            <ReportControls
              localStatus={localStatus}
              localIsHidden={localIsHidden}
              localNotes={localNotes}
              onNotesChange={setLocalNotes}
              onSaveNotes={handleSaveNotes}
              onStatusChange={handleStatusChange}
              onToggleHidden={handleToggleHidden}
              report={report}
            />

            {/* Action Buttons */}
            <ReportActions
              localIsHidden={localIsHidden}
              localStatus={localStatus}
              onToggleHidden={handleToggleHidden}
              onMarkReviewed={handleStatusChange}
              onDismiss={handleStatusChange}
            />

            {/* Delete Button */}
            <div className="border-t pt-4">
              <Button
                onClick={() => setShowDeleteDialog(true)}
                variant="destructive"
                className="w-full"
                disabled={isGuest}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Report Permanently
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        open={showDeleteDialog}
        setOpen={setShowDeleteDialog}
        report={report}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
};
