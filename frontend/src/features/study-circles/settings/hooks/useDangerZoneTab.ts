import { useState } from "react";

import { toast } from "sonner";

import { useCirclePermission } from "../../security/useCirclePermission";

interface UseDangerZoneTabProps {
  onClose: () => void;
}

export function useDangerZoneTab({ onClose }: UseDangerZoneTabProps) {
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const { isOwner, canDefinitely } = useCirclePermission();

  // Owners cannot leave — they must delete or transfer ownership first
  const canLeave = !isOwner;
  // Hard static check — only true for OWNER, no data-dependent pass-through
  const canDelete = canDefinitely("circles", "delete");

  const handleLeave = () => {
    toast.success("You have left the circle.");
    setShowLeaveDialog(false);
    onClose();
  };

  const handleDelete = () => {
    toast.success("Circle has been permanently deleted.");
    setShowDeleteDialog(false);
    onClose();
  };

  return {
    // Dialog state
    showLeaveDialog,
    setShowLeaveDialog,
    showDeleteDialog,
    setShowDeleteDialog,
    deleteConfirm,
    setDeleteConfirm,
    // Permissions
    canLeave,
    canDelete,
    // Handlers
    handlers: {
      handleLeave,
      handleDelete,
    },
  };
}
