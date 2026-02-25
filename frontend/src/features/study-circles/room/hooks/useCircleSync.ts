/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from "react";

import { useQueryClient, type InfiniteData } from "@tanstack/react-query";

import { useUpdateCircleMemberLastReadAtMutation } from "@/queries/circle";
import type {
  CircleMessagesResponse,
  StudyCircle,
  CircleMessage,
} from "@/zodSchemas/circle.zod";

import { circleSocketService } from "../../services/socketService";

export const useCircleSync = (currentCircleId: string | null) => {
  const queryClient = useQueryClient();
  const updateLastReadAtMutation = useUpdateCircleMemberLastReadAtMutation();

  // EFFECT 1: Handle Study Circle Selection (Opening a chat room)
  useEffect(() => {
    if (!currentCircleId) return;

    // 1. Immediately reset the unread count in the UI for the clicked circle
    queryClient.setQueryData<StudyCircle[]>(
      ["chat", "groups", "list"],
      (old) => {
        if (!old) return old;
        return old.map((g) =>
          g.id === currentCircleId ? { ...g, unreadCount: 0 } : g,
        );
      },
    );

    // 2. Sync server-side read status
    updateLastReadAtMutation.mutate(currentCircleId);

    // 3. Join socket room
    circleSocketService.joinCircle(currentCircleId);

    return () => {
      circleSocketService.leaveCircle(currentCircleId);
    };
  }, [currentCircleId, queryClient]);

  // EFFECT 2: Handle Incoming Real-time Messages
  useEffect(() => {
    const unsubscribe = circleSocketService.onMessage(
      (message: CircleMessage) => {
        const { chatGroupId } = message;

        // 1. Update Active Message List if the message belongs to the current room
        if (currentCircleId === chatGroupId) {
          queryClient.setQueryData<InfiniteData<CircleMessagesResponse>>(
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
        queryClient.setQueryData<StudyCircle[]>(
          ["chat", "groups", "list"],
          (old) => {
            if (!old) return old;

            return old.map((group) => {
              if (group.id !== chatGroupId) return group;

              const isViewingThisGroup = currentCircleId === chatGroupId;

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
        if (currentCircleId === chatGroupId) {
          updateLastReadAtMutation.mutate(chatGroupId);
        }
      },
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentCircleId, queryClient]);
};
