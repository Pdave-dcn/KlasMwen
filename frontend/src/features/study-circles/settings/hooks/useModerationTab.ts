import { useState } from "react";

import { toast } from "sonner";

import { useSetCircleMemberMuteMutation } from "@/queries/circle";
import { useCircleStore } from "@/stores/circle.store";
import type { CircleMember } from "@/zodSchemas/circle.zod";

interface UseModerationTabProps {
  members: CircleMember[];
  initialSlowMode: boolean;
}

export function useModerationTab({
  members,
  initialSlowMode,
}: UseModerationTabProps) {
  const [slowMode, setSlowMode] = useState(initialSlowMode);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const currentCircleId =
    useCircleStore((state) => state.selectedCircleId) ?? "";

  const setMuteMutation = useSetCircleMemberMuteMutation(currentCircleId);

  const mutedMembers = members.filter((m) => m.isMuted);

  const handleUnmute = (member: CircleMember) => {
    setMuteMutation.mutate({ userId: member.user.id, muted: false });
  };

  const handleSlowModeToggle = (checked: boolean) => {
    setSlowMode(checked);
    toast.success(checked ? "Slow mode enabled." : "Slow mode disabled.");
  };

  // todo: implement actual chat clearing functionality
  const handleClearChat = () => {
    toast.success("Chat history has been cleared.");
    setShowClearConfirm(false);
  };

  return {
    // State
    slowMode,
    showClearConfirm,
    setShowClearConfirm,
    // Derived
    mutedMembers,
    // Handlers
    handlers: {
      handleUnmute,
      handleSlowModeToggle,
      handleClearChat,
    },
  };
}
