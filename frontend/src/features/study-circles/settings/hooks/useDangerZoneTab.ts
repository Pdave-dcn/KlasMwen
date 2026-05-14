import { useState } from "react";

import {
  useDeleteCircleMutation,
  useLeaveCircleMutation,
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

  const { selectedCircleId, currentUser, resetSelectedCircle } =
    useCircleStore();

  const deleteCircleMutation = useDeleteCircleMutation();
  const leaveCircleMutation = useLeaveCircleMutation();

  const { isOwner, canDefinitely } = useCirclePermission();

  // Owners cannot leave — they must delete or transfer ownership first
  const canLeave = !isOwner;
  // Hard static check — only true for OWNER, no data-dependent pass-through
  const canDelete = canDefinitely("circles", "delete");

  const handleLeave = () => {
    if (!currentUser) return;
    leaveCircleMutation.mutate(selectedCircleId, {
      onSuccess: () => {
        resetSelectedCircle();
        setShowLeaveDialog(false);
        onClose();
      },
    });
  };

  const handleDelete = () => {
    if (!selectedCircleId) return;
    deleteCircleMutation.mutate(selectedCircleId, {
      onSuccess: () => {
        resetSelectedCircle();
        setShowDeleteDialog(false);
        onClose();
      },
    });
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

    // Mutation
    pending: {
      leaving: leaveCircleMutation.isPending,
      deleting: deleteCircleMutation.isPending,
    },

    // Handlers
    handlers: {
      handleLeave,
      handleDelete,
    },
  };
}
