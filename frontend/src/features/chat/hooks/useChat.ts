import { useCallback, useEffect } from "react";

import { useQueryClient, type InfiniteData } from "@tanstack/react-query";

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
import type { ChatMessagesResponse } from "@/zodSchemas/chat.zod";

import { chatSocketService } from "../services/socketService";

export const useChat = () => {
  const { selectedGroupId, isMuted, selectGroup, setCurrentUser } =
    useChatStore();

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
  const messages = messagesData
    ? messagesData.pages.flatMap((page) => page.data).reverse()
    : [];

  // Send message mutation
  const sendMessageMutation = useSendChatMessageMutation(selectedGroupId ?? "");

  // Handle group selection - join socket room
  useEffect(() => {
    if (!selectedGroupId) return;
    chatSocketService.joinRoom(selectedGroupId);

    return () => {
      if (selectedGroupId) {
        chatSocketService.leaveRoom(selectedGroupId);
      }
    };
  }, [selectedGroupId]);

  const queryClient = useQueryClient();

  // Listen for incoming messages via socket
  useEffect(() => {
    const unsubscribe = chatSocketService.onMessage((message) => {
      queryClient.setQueryData<InfiniteData<ChatMessagesResponse>>(
        ["chat", "groups", message.chatGroupId, "messages"],
        (oldData) => {
          // Handle Empty Cache: If no messages exist yet, create the first page
          if (!oldData?.pages.length) {
            return {
              pages: [
                {
                  data: [message],
                  pagination: {
                    hasMore: false,
                    nextCursor: null,
                  },
                },
              ],
              pageParams: [undefined],
            };
          }

          const [firstPage, ...restPages] = oldData.pages;

          // Duplicate Check: Prevent the same message from appearing twice
          if (firstPage.data.some((m) => m.id === message.id)) {
            return oldData;
          }

          // Return updated structure
          return {
            ...oldData,
            pages: [
              {
                ...firstPage,
                data: [message, ...firstPage.data],
              },
              ...restPages,
            ],
          };
        },
      );
    });

    return unsubscribe;
  }, [queryClient]);

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

      await sendMessageMutation.mutateAsync({ content });
    },
    [selectedGroupId, isMuted, sendMessageMutation],
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
