import { useState } from "react";

import {
  useDeleteCircleMutation,
  useRemoveCircleMemberMutation,
} from "@/queries/circle";
import { useCircleStore } from "@/stores/circle.store";

import { useCirclePermission } from "../../security/useCirclePermission";

interface UseDangerZoneTabProps {
  onClose: () => void;
}

export function useDangerZoneTab({ onClose }: UseDangerZoneTabProps) {
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const { selectedCircleId, currentUser, selectCircle } = useCircleStore();

  const deleteCircleMutation = useDeleteCircleMutation();
  const leaveCircleMutation = useRemoveCircleMemberMutation(selectedCircleId);

  const { isOwner, canDefinitely } = useCirclePermission();

  // Owners cannot leave — they must delete or transfer ownership first
  const canLeave = !isOwner;
  // Hard static check — only true for OWNER, no data-dependent pass-through
  const canDelete = canDefinitely("circles", "delete");

  const handleLeave = () => {
    if (currentUser) {
      leaveCircleMutation.mutate({
        userId: currentUser.id,
        isSelfRemoval: true,
      });
    }
    setShowLeaveDialog(false);
    onClose();
    selectCircle(null); // Clear circle from store to avoid showing stale data while redirecting
  };

  const handleDelete = () => {
    if (selectedCircleId) {
      deleteCircleMutation.mutate(selectedCircleId);
    }
    setShowDeleteDialog(false);
    onClose();
    selectCircle(null);
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
