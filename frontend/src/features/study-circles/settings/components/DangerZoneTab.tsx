import { LogOut, Trash2, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import { useDangerZoneTab } from "../hooks/useDangerZoneTab";

interface DangerZoneTabProps {
  circleName: string;
  onClose: () => void;
}

const DELETE_CONFIRM = "DELETE MY CIRCLE";

export function DangerZoneTab({ circleName, onClose }: DangerZoneTabProps) {
  const {
    showLeaveDialog,
    setShowLeaveDialog,
    showDeleteDialog,
    setShowDeleteDialog,
    deleteConfirm,
    setDeleteConfirm,
    canLeave,
    canDelete,
    handlers,
  } = useDangerZoneTab({ onClose });

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/5">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <h4 className="font-semibold text-destructive text-sm">
            Danger Zone
          </h4>
        </div>
        <p className="text-xs text-muted-foreground">
          Actions here are irreversible. Please proceed with caution.
        </p>
      </div>

      {/* Leave Circle — not available to OWNER */}
      {canLeave && (
        <div className="flex items-center justify-between p-4 rounded-xl border border-border">
          <div>
            <p className="text-sm font-medium text-foreground">Leave Circle</p>
            <p className="text-xs text-muted-foreground">
              You will lose access to all messages and need a new invite to
              rejoin.
            </p>
          </div>
          <Button
            variant="outline"
            className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground gap-2"
            onClick={() => setShowLeaveDialog(true)}
          >
            <LogOut className="h-4 w-4" />
            Leave
          </Button>
        </div>
      )}

      {/* Delete Circle — OWNER only */}
      {canDelete && (
        <div className="flex items-center justify-between p-4 rounded-xl border-2 border-destructive/30 bg-destructive/5">
          <div>
            <p className="text-sm font-medium text-destructive">
              Delete Circle
            </p>
            <p className="text-xs text-muted-foreground">
              Permanently delete "{circleName}" and all its data. All members
              will be removed.
            </p>
          </div>
          <Button
            variant="destructive"
            className="rounded-xl gap-2"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      )}

      {/* Leave Confirmation */}
      <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Leave "{circleName}"?</DialogTitle>
            <DialogDescription>
              You'll lose access to this circle's messages and files. You'll
              need a new invite to rejoin.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowLeaveDialog(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handlers.handleLeave}
              className="rounded-xl"
            >
              Leave Circle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete "{circleName}"
            </DialogTitle>
            <DialogDescription>
              This will permanently delete the circle and all its data. Type{" "}
              <strong>{DELETE_CONFIRM}</strong> to confirm.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder={DELETE_CONFIRM}
            className="rounded-xl"
          />
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowDeleteDialog(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteConfirm !== DELETE_CONFIRM}
              onClick={handlers.handleDelete}
              className="rounded-xl"
            >
              Permanently Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
