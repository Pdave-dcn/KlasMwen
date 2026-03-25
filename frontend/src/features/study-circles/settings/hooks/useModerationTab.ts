import { useMemo, useState } from "react";

import { toast } from "sonner";

import {
  useMutedCircleMembersQuery,
  useSetCircleMemberMuteMutation,
} from "@/queries/circle";
import { useCircleStore } from "@/stores/circle.store";
import type { CircleMember } from "@/zodSchemas/circle.zod";

interface UseModerationTabProps {
  initialSlowMode: boolean;
}

export function useModerationTab({ initialSlowMode }: UseModerationTabProps) {
  const [slowMode, setSlowMode] = useState(initialSlowMode);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const currentCircleId = useCircleStore((state) => state.selectedCircleId);

  const setMuteMutation = useSetCircleMemberMuteMutation(currentCircleId);

  const {
    data: mutedMembersData,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useMutedCircleMembersQuery(currentCircleId);

  const mutedMembers = useMemo(
    () =>
      mutedMembersData
        ? [...mutedMembersData.pages.flatMap((p) => p.data)]
        : [],
    [mutedMembersData],
  );

  const mutedTotal = mutedMembersData?.pages[0]?.mutedTotal ?? 0;

  const handleUnmute = (member: CircleMember) => {
    setMuteMutation.mutate({ userId: member.user.id, muted: false });
  };

  // todo: implement actual slow mode functionality
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
    isLoading,
    isError,
    // Derived
    mutedMembers,
    mutedTotal,
    // Handlers
    handlers: {
      handleUnmute,
      handleSlowModeToggle,
      handleClearChat,
    },
    pagination: {
      hasNextPage: !!hasNextPage,
      fetchNextPage,
      isFetchingNextPage,
    },
  };
}
