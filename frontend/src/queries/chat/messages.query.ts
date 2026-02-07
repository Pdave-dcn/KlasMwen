import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { toast } from "sonner";

import {
  getChatMessages,
  sendChatMessage,
  deleteChatMessage,
} from "@/api/chat";
import type { User } from "@/types/auth.type";
import type {
  SendMessageData,
  ChatMessage,
  ChatMessagesResponse,
  ChatGroup,
} from "@/zodSchemas/chat.zod";

// Queries

export const useChatMessagesQuery = (
  chatGroupId: string,
  limit: number = 50,
) => {
  return useInfiniteQuery({
    queryKey: ["chat", "groups", chatGroupId, "messages"],
    queryFn: ({ pageParam }) => getChatMessages(chatGroupId, pageParam, limit),
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.nextCursor
        : undefined;
    },
    initialPageParam: undefined as number | undefined,
    enabled: !!chatGroupId,
  });
};

// Mutations

/**
 * Optimistic Send Message Mutation
 * Manually updates the messages cache and group list preview before the server responds.
 */
export const useSendChatMessageMutation = (
  chatGroupId: string,
  currentUser: User | null,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SendMessageData) => sendChatMessage(chatGroupId, data),

    onMutate: async (newMessageData) => {
      if (!currentUser) return;

      await queryClient.cancelQueries({
        queryKey: ["chat", "groups", chatGroupId, "messages"],
      });
      await queryClient.cancelQueries({ queryKey: ["chat", "groups", "list"] });

      const previousMessages = queryClient.getQueryData([
        "chat",
        "groups",
        chatGroupId,
        "messages",
      ]);
      const previousGroups = queryClient.getQueryData([
        "chat",
        "groups",
        "list",
      ]);

      // Temporary optimistic message
      const optimisticMessage: ChatMessage = {
        id: Math.random() * -1,
        content: newMessageData.content,
        chatGroupId,
        createdAt: new Date().toISOString(),
        sender: {
          id: currentUser.id,
          username: currentUser.username,
          avatar: {
            url: currentUser.avatar?.url ?? "",
          },
        },
      };

      // Optimistically update the message list
      queryClient.setQueryData<InfiniteData<ChatMessagesResponse>>(
        ["chat", "groups", chatGroupId, "messages"],
        (oldData) => {
          if (!oldData) return oldData;
          const [firstPage, ...rest] = oldData.pages;
          return {
            ...oldData,
            pages: [
              { ...firstPage, data: [optimisticMessage, ...firstPage.data] },
              ...rest,
            ],
          };
        },
      );

      // Optimistically update the sidebar preview
      queryClient.setQueryData<ChatGroup[]>(
        ["chat", "groups", "list"],
        (oldGroups) => {
          if (!oldGroups) return oldGroups;
          return oldGroups.map((g) =>
            g.id === chatGroupId
              ? { ...g, latestMessage: optimisticMessage }
              : g,
          );
        },
      );

      return { previousMessages, previousGroups };
    },

    onError: (_err, _newMessage, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(
          ["chat", "groups", chatGroupId, "messages"],
          context.previousMessages,
        );
      }
      if (context?.previousGroups) {
        queryClient.setQueryData(
          ["chat", "groups", "list"],
          context.previousGroups,
        );
      }
      toast.error("Failed to send message");
    },

    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["chat", "groups", chatGroupId, "messages"],
        refetchType: "none",
      });
    },
  });
};

export const useDeleteChatMessageMutation = (chatGroupId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: number) =>
      deleteChatMessage(chatGroupId, messageId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["chat", "groups", chatGroupId, "messages"],
      });
    },
  });
};
