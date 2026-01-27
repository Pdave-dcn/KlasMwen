/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from "react";

import { useQueryClient, type InfiniteData } from "@tanstack/react-query";

import { useUpdateChatMemberLastReadAtMutation } from "@/queries/chat.query";
import type {
  ChatMessagesResponse,
  ChatGroup,
  ChatMessage,
} from "@/zodSchemas/chat.zod";

import { chatSocketService } from "../services/socketService";

export const useChatSync = (currentGroupId: string | null) => {
  const queryClient = useQueryClient();
  const updateLastReadAtMutation = useUpdateChatMemberLastReadAtMutation();

  // EFFECT 1: Handle Group Selection (Opening a chat)
  useEffect(() => {
    if (!currentGroupId) return;

    // 1. Immediately reset the unread count in the UI for the clicked group
    queryClient.setQueryData<ChatGroup[]>(["chat", "groups", "list"], (old) => {
      if (!old) return old;
      return old.map((g) =>
        g.id === currentGroupId ? { ...g, unreadCount: 0 } : g,
      );
    });

    // 2. Sync server-side read status
    updateLastReadAtMutation.mutate(currentGroupId);

    // 3. Join socket room
    chatSocketService.joinRoom(currentGroupId);

    return () => {
      chatSocketService.leaveRoom(currentGroupId);
    };
  }, [currentGroupId, queryClient]);

  // EFFECT 2: Handle Incoming Real-time Messages
  useEffect(() => {
    const unsubscribe = chatSocketService.onMessage((message: ChatMessage) => {
      const { chatGroupId } = message;

      // 1. Update Active Message List if the message belongs to the current room
      if (currentGroupId === chatGroupId) {
        queryClient.setQueryData<InfiniteData<ChatMessagesResponse>>(
          ["chat", "groups", chatGroupId, "messages"],
          (oldData) => {
            if (!oldData?.pages.length) return oldData;

            const [firstPage, ...restPages] = oldData.pages;

            const isDuplicate = firstPage.data.some(
              (m) =>
                m.id === message.id ||
                (m.id < 0 &&
                  m.content === message.content &&
                  m.sender.id === message.sender.id),
            );

            if (isDuplicate) {
              return {
                ...oldData,
                pages: [
                  {
                    ...firstPage,
                    data: firstPage.data.map((m) =>
                      m.id < 0 &&
                      m.content === message.content &&
                      m.sender.id === message.sender.id
                        ? message
                        : m,
                    ),
                  },
                  ...restPages,
                ],
              };
            }

            return {
              ...oldData,
              pages: [
                { ...firstPage, data: [message, ...firstPage.data] },
                ...restPages,
              ],
            };
          },
        );
      }

      // 2. Update Sidebar Group List for ALL incoming messages (Global Sync)
      queryClient.setQueryData<ChatGroup[]>(
        ["chat", "groups", "list"],
        (old) => {
          if (!old) return old;

          return old.map((group) => {
            if (group.id !== chatGroupId) return group;

            const isViewingThisGroup = currentGroupId === chatGroupId;

            return {
              ...group,
              latestMessage: message,
              // If viewing, keep at 0. If not, increment.
              unreadCount: isViewingThisGroup
                ? 0
                : (group.unreadCount || 0) + 1,
            };
          });
        },
      );

      // 3. Keep server synced if message arrives while looking at the chat
      if (currentGroupId === chatGroupId) {
        updateLastReadAtMutation.mutate(chatGroupId);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentGroupId, queryClient]);
};
