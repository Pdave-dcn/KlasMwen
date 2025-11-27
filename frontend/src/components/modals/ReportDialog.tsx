import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { useReportReasonsQuery } from "@/queries/report.query";
import type { ResourceType } from "@/zodSchemas/report.zod";

import { Spinner } from "../ui/spinner";

interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reasonId: number) => void;
  contentType: ResourceType | null;
}

export const ReportDialog = ({
  isOpen,
  onClose,
  onSubmit,
  contentType,
}: ReportDialogProps) => {
  const [selectedReason, setSelectedReason] = useState("");

  const {
    data: reasons,
    isLoading,
    isFetching,
    error,
  } = useReportReasonsQuery();

  const reportReasons =
    reasons?.map((r) => ({
      value: String(r.id),
      label: r.label,
      description: r.description,
    })) ?? [];

  const currentReason = reportReasons.find(
    (reason) => reason.value === selectedReason
  );

  const handleSubmit = () => {
    if (selectedReason) {
      onSubmit(Number(selectedReason));
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedReason("");
    onClose();
  };

  const dialogContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-40">
          <Spinner />
          <p className="ml-2 text-sm text-muted-foreground">
            Loading reasons...
          </p>
        </div>
      );
    }

    if (error) {
      return (
        <p className="text-red-500 text-sm p-4">
          Failed to load report reasons. Please try again.
        </p>
      );
    }

    return (
      <>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason *</Label>
            <Select
              value={selectedReason}
              onValueChange={(value) => setSelectedReason(value)}
              disabled={isFetching}
            >
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {reportReasons.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedReason && currentReason && (
            <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">
                {currentReason.label}
              </p>
              <p>{currentReason.description}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isFetching}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedReason || isFetching}
          >
            Submit Report
          </Button>
        </DialogFooter>
      </>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Report {contentType}</DialogTitle>
          <DialogDescription>
            Please select a reason for reporting this {contentType}. Your report
            will be reviewed by our moderation team.
          </DialogDescription>
        </DialogHeader>
        {dialogContent()}
      </DialogContent>
    </Dialog>
  );
};
