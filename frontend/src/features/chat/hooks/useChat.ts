import { useCallback, useEffect } from "react";

import { toast } from "sonner";

import {
  useChatGroupsQuery,
  useChatGroupQuery,
  useChatMembersQuery,
  useChatMessagesQuery,
  useSendChatMessageMutation,
} from "@/queries/chat.query";
import { useAuthStore } from "@/stores/auth.store";
import { useChatStore } from "@/stores/chat.store";
import { usePresenceStore } from "@/stores/presence.store";

import { chatSocketService } from "../services/socketService";

export const useChat = () => {
  const {
    selectedGroupId,
    isMuted,
    selectGroup,
    setCurrentUser,
    markGroupAsRead,
    addMessage,
  } = useChatStore();

  const { onlineUsers } = usePresenceStore.getState();

  const currentUser = useAuthStore((state) => state.user);

  useEffect(() => {
    if (currentUser) {
      setCurrentUser(currentUser);
    }
  }, [currentUser, setCurrentUser]);

  // Fetch all user's chat groups
  const { data: groups = [], isLoading: isLoadingGroups } =
    useChatGroupsQuery();

  // Fetch selected group details
  const { data: selectedGroup } = useChatGroupQuery(selectedGroupId ?? "");

  // Fetch members of selected group
  const { data: members = [], isLoading: isLoadingMembers } =
    useChatMembersQuery(selectedGroupId ?? "");

  const enrichedMembers = members.map((member) => ({
    ...member,
    isOnline: onlineUsers.has(member.userId),
  }));

  // Fetch messages with infinite scroll support
  const {
    data: messagesData,
    isLoading: isLoadingMessages,
    fetchNextPage,
    hasNextPage,
  } = useChatMessagesQuery(selectedGroupId ?? "");

  // Flatten all message pages into single array
  const messages = messagesData?.pages.flatMap((page) => page.data) ?? [];

  // Send message mutation
  const sendMessageMutation = useSendChatMessageMutation(selectedGroupId ?? "");

  // Initialize socket connection
  useEffect(() => {
    chatSocketService.connect("/chat");

    return () => {
      chatSocketService.disconnect();
    };
  }, []);

  // Handle group selection - join socket room
  useEffect(() => {
    if (!selectedGroupId) return;

    chatSocketService.joinRoom(selectedGroupId);
    markGroupAsRead(selectedGroupId);

    return () => {
      if (selectedGroupId) {
        chatSocketService.leaveRoom(selectedGroupId);
      }
    };
  }, [selectedGroupId, markGroupAsRead]);

  // Listen for incoming messages via socket
  useEffect(() => {
    const unsubscribe = chatSocketService.onMessage((message) => {
      if (message.chatGroupId === selectedGroupId) {
        addMessage(message);
      }
    });

    return unsubscribe;
  }, [selectedGroupId, addMessage]);

  // Handle group selection
  const handleSelectGroup = useCallback(
    (groupId: string) => {
      selectGroup(groupId);
    },
    [selectGroup],
  );

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!selectedGroupId || !content.trim() || isMuted) return;

      try {
        const message = await sendMessageMutation.mutateAsync({ content });

        // Optimistically update local UI state
        addMessage(message);
      } catch (error) {
        console.error("Failed to send message:", error);
        toast.error("Failed to send message");
      }
    },
    [selectedGroupId, isMuted, addMessage, sendMessageMutation],
  );

  // Load more messages
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isLoadingMessages) {
      void fetchNextPage();
    }
  }, [hasNextPage, isLoadingMessages, fetchNextPage]);

  return {
    // Data
    groups,
    selectedGroup,
    selectedGroupId,
    messages,
    enrichedMembers,
    currentUser,

    // Loading states
    isLoadingGroups,
    isLoadingMessages,
    isLoadingMembers,
    isMuted,

    // Pagination
    hasNextPage,

    // Actions
    handleSelectGroup,
    handleSendMessage,
    handleLoadMore,
  };
};
