import { useState } from "react";

import { CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";

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
  onToggleHidden: (reportId: number) => void;
  onUpdateNotes: (reportId: number, notes: string) => void;
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
}: ReportModalProps) => {
  const [localNotes, setLocalNotes] = useState(report?.moderatorNotes ?? "");
  const [localStatus, setLocalStatus] = useState(report?.status ?? "PENDING");

  if (!report) return null;

  const handleSaveNotes = () => {
    onUpdateNotes(report.id, localNotes);
  };

  const handleStatusChange = (status: ReportStatusEnum) => {
    setLocalStatus(status);
    onUpdateStatus(report.id, status);
  };

  const handleToggleHidden = () => {
    onToggleHidden(report.id);
  };

  return (
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
                {report.isContentHidden && (
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
                <Select value={localStatus} onValueChange={handleStatusChange}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                    <SelectItem value="dismissed">Dismissed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="hidden">Content Hidden</Label>
                <Switch
                  id="hidden"
                  checked={report.isContentHidden}
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
              {report.isContentHidden ? (
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
        </div>
      </DialogContent>
    </Dialog>
  );
};
