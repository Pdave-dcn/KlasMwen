import { useCallback, useEffect, useMemo } from "react";

import { useSendChatMessageMutation } from "@/queries/chat";
import { useAuthStore } from "@/stores/auth.store";
import { useCircleStore } from "@/stores/circle.store";

import { useCircleData } from "./useCircleData";
import { useCirclePresence } from "./useCirclePresence";
import { useCircleSync } from "./useCircleSync";

export const useCircleRoom = () => {
  const { selectedCircleId, selectCircle, setCurrentUser } = useCircleStore();
  const currentUser = useAuthStore((state) => state.user);

  useEffect(() => {
    if (currentUser) setCurrentUser(currentUser);
  }, [currentUser, setCurrentUser]);

  useCircleSync(selectedCircleId);

  useCirclePresence(selectedCircleId);

  const {
    groups,
    selectedCircle,
    members,
    messages,
    isLoadingCircles,
    isLoadingMembers,
    isLoadingMessages,
    isFetchingNextPage,
    pagination,
  } = useCircleData(selectedCircleId);

  const isMuted = useMemo(() => {
    const me = members.find((m) => m.userId === currentUser?.id);
    return me?.isMuted ?? false;
  }, [members, currentUser?.id]);

  const sendMessageMutation = useSendChatMessageMutation(
    selectedCircleId ?? "",
    currentUser,
  );

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!selectedCircleId || !content.trim() || isMuted) return;
      await sendMessageMutation.mutateAsync({ content });
    },
    [selectedCircleId, isMuted, sendMessageMutation],
  );

  const handleLoadMore = useCallback(() => {
    if (pagination.hasNextPage && !isFetchingNextPage) {
      void pagination.fetchNextPage();
    }
  }, [pagination, isFetchingNextPage]);

  return {
    groups,
    selectedCircle,
    messages,
    members,
    currentUser,
    selectedCircleId,
    isLoadingCircles,
    isLoadingMessages,
    isLoadingMembers,
    isMuted,
    hasNextPage: pagination.hasNextPage,
    handleSelectCircle: selectCircle,
    handleSendMessage,
    handleLoadMore,
  };
};
