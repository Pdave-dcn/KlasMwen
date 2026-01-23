import { useEffect } from "react";

import { useQueryClient, type InfiniteData } from "@tanstack/react-query";

import type { ChatMessagesResponse, ChatMessage } from "@/zodSchemas/chat.zod";

import { chatSocketService } from "../services/socketService";

export const useChatSocket = (groupId: string | null) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!groupId) return;

    // Join room
    chatSocketService.joinRoom(groupId);

    // Listener for new messages
    const unsubscribe = chatSocketService.onMessage((message: ChatMessage) => {
      queryClient.setQueryData<InfiniteData<ChatMessagesResponse>>(
        ["chat", "groups", message.chatGroupId, "messages"],
        (oldData) => {
          if (!oldData?.pages.length) {
            return {
              pages: [
                {
                  data: [message],
                  pagination: { hasMore: false, nextCursor: null },
                },
              ],
              pageParams: [undefined],
            };
          }

          const [firstPage, ...restPages] = oldData.pages;
          if (firstPage.data.some((m) => m.id === message.id)) return oldData;

          return {
            ...oldData,
            pages: [
              { ...firstPage, data: [message, ...firstPage.data] },
              ...restPages,
            ],
          };
        },
      );
    });

    return () => {
      chatSocketService.leaveRoom(groupId);
      unsubscribe();
    };
  }, [groupId, queryClient]);
};
