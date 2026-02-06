import { useCallback, useEffect, useMemo } from "react";

import { useSendChatMessageMutation } from "@/queries/chat.query";
import { useAuthStore } from "@/stores/auth.store";
import { useChatStore } from "@/stores/chat.store";

import { useChatData } from "./useChatData";
import { useChatPresence } from "./useChatPresence";
import { useChatSync } from "./useChatSync";

export const useChat = () => {
  const { selectedGroupId, selectGroup, setCurrentUser } = useChatStore();
  const currentUser = useAuthStore((state) => state.user);

  useEffect(() => {
    if (currentUser) setCurrentUser(currentUser);
  }, [currentUser, setCurrentUser]);

  useChatSync(selectedGroupId);

  useChatPresence(selectedGroupId);

  const {
    groups,
    selectedGroup,
    members,
    messages,
    isLoadingGroups,
    isLoadingMembers,
    isLoadingMessages,
    isFetchingNextPage,
    pagination,
  } = useChatData(selectedGroupId);

  const isMuted = useMemo(() => {
    const me = members.find((m) => m.userId === currentUser?.id);
    return me?.isMuted ?? false;
  }, [members, currentUser?.id]);

  const sendMessageMutation = useSendChatMessageMutation(
    selectedGroupId ?? "",
    currentUser,
  );

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!selectedGroupId || !content.trim() || isMuted) return;
      await sendMessageMutation.mutateAsync({ content });
    },
    [selectedGroupId, isMuted, sendMessageMutation],
  );

  const handleLoadMore = useCallback(() => {
    if (pagination.hasNextPage && !isFetchingNextPage) {
      void pagination.fetchNextPage();
    }
  }, [pagination, isFetchingNextPage]);

  return {
    groups,
    selectedGroup,
    messages,
    members,
    currentUser,
    selectedGroupId,
    isLoadingGroups,
    isLoadingMessages,
    isLoadingMembers,
    isMuted,
    hasNextPage: pagination.hasNextPage,
    handleSelectGroup: selectGroup,
    handleSendMessage,
    handleLoadMore,
  };
};
