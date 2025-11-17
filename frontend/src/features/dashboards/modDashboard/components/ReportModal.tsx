import { useState, useEffect } from "react";

import { CheckCircle, XCircle, Eye, EyeOff, Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Report, ReportStatusEnum } from "@/zodSchemas/report.zod";

interface ReportModalProps {
  report: Report | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (reportId: number, status: ReportStatusEnum) => void;
  onToggleHidden: (report: Report) => void;
  onUpdateNotes: (report: Report, notes: string) => void;
  onDelete: (reportId: number) => void;
}

const getStatusBadge = (status: Report["status"]) => {
  const variants = {
    PENDING: "bg-pending text-pending-foreground",
    REVIEWED: "bg-reviewed text-reviewed-foreground",
    DISMISSED: "bg-dismissed text-dismissed-foreground",
  };

  return (
    <Badge className={variants[status]}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

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

  // Sync local state when report changes
  useEffect(() => {
    if (report) {
      setLocalNotes(report.moderatorNotes ?? "");
      setLocalStatus(report.status);
      setLocalIsHidden(report.isContentHidden);
    }
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

  const handleSaveNotes = () => {
    onUpdateNotes(report, localNotes);
  };

  const handleStatusChange = (status: ReportStatusEnum) => {
    setLocalStatus(status);
    onUpdateStatus(report.id, status);
  };

  const handleToggleHidden = () => {
    // Optimistically update local state
    setLocalIsHidden(!localIsHidden);
    onToggleHidden(report);
  };

  const handleDelete = () => {
    onDelete(report.id);
    setShowDeleteDialog(false);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
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
            {/* Reporter Info */}
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Reporter Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Username:</span>
                  <p className="font-medium">{report.reporter.username}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <p className="font-medium">{report.reporter.email}</p>
                </div>
              </div>
            </div>

            {/* Content Info */}
            <div>
              <h3 className="font-semibold mb-2">Reported Content</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{report.contentType}</Badge>
                  <Badge variant="outline">
                    ID: {report.comment?.id ?? report.post?.id}
                  </Badge>
                  {localIsHidden && (
                    <Badge className="bg-destructive text-destructive-foreground">
                      Content Hidden
                    </Badge>
                  )}
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">
                    {report.contentType === "post"
                      ? report.post?.title
                      : report.comment?.content}
                  </p>
                </div>
              </div>
            </div>

            {/* Report Reason */}
            <div>
              <h3 className="font-semibold mb-2">Report Reason</h3>
              <div className="space-y-2">
                <Badge variant="outline">{report.reason.label}</Badge>
                {report.reason.description && (
                  <p className="text-sm text-muted-foreground">
                    {report.reason.description}
                  </p>
                )}
              </div>
            </div>

            {/* Status and Controls */}
            <div className="space-y-4 border-t pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={localStatus}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="REVIEWED">Reviewed</SelectItem>
                      <SelectItem value="DISMISSED">Dismissed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="hidden">Content Hidden</Label>
                  <Switch
                    id="hidden"
                    checked={localIsHidden}
                    onCheckedChange={handleToggleHidden}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Moderator Notes</Label>
                <Textarea
                  id="notes"
                  value={localNotes}
                  onChange={(e) => setLocalNotes(e.target.value)}
                  placeholder="Add notes about this report..."
                  rows={4}
                  className="mt-2"
                />
                <Button
                  onClick={handleSaveNotes}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  Save Notes
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 border-t pt-4">
              <Button
                onClick={() => handleStatusChange("REVIEWED")}
                className="flex-1"
                disabled={localStatus === "REVIEWED"}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark Reviewed
              </Button>
              <Button
                onClick={() => handleStatusChange("DISMISSED")}
                variant="outline"
                className="flex-1"
                disabled={localStatus === "DISMISSED"}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Dismiss
              </Button>
              <Button onClick={handleToggleHidden} variant="outline">
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

            {/* Delete Button - Separate and Dangerous */}
            <div className="border-t pt-4">
              <Button
                onClick={() => setShowDeleteDialog(true)}
                variant="destructive"
                className="w-full"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Report Permanently
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Report?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete report{" "}
              <strong>RPT-{report.id}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
