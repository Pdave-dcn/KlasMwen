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

  const currentCircleId =
    useCircleStore((state) => state.selectedCircleId) ?? "";
  const currentUserId = useCircleStore((state) => state.currentUser?.id) ?? "";

  const deleteCircleMutation = useDeleteCircleMutation();
  const leaveCircleMutation = useRemoveCircleMemberMutation(currentCircleId);

  const { isOwner, canDefinitely } = useCirclePermission();

  // Owners cannot leave — they must delete or transfer ownership first
  const canLeave = !isOwner;
  // Hard static check — only true for OWNER, no data-dependent pass-through
  const canDelete = canDefinitely("circles", "delete");

  const handleLeave = () => {
    leaveCircleMutation.mutate(currentUserId);
    setShowLeaveDialog(false);
    onClose();
  };

  const handleDelete = () => {
    deleteCircleMutation.mutate(currentCircleId);
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
