import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { toast } from "sonner";

import {
  getCircleMessages,
  sendCircleMessage,
  deleteCircleMessage,
} from "@/api/circle";
import type { User } from "@/types/auth.type";
import type {
  SendMessageData,
  ChatMessage,
  ChatMessagesResponse,
  ChatGroup,
} from "@/zodSchemas/chat.zod";

// Queries

export const useCircleMessagesQuery = (
  circleId: string,
  limit: number = 50,
) => {
  return useInfiniteQuery({
    queryKey: ["circles", circleId, "messages"],
    queryFn: ({ pageParam }) => getCircleMessages(circleId, pageParam, limit),
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.nextCursor
        : undefined;
    },
    initialPageParam: undefined as number | undefined,
    enabled: !!circleId,
  });
};

// Mutations

/**
 * Optimistic Send Message Mutation
 * Manually updates the messages cache and circle list preview before the server responds.
 */
export const useSendCircleMessageMutation = (
  circleId: string,
  currentUser: User | null,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SendMessageData) => sendCircleMessage(circleId, data),

    onMutate: async (newMessageData) => {
      if (!currentUser) return;

      await queryClient.cancelQueries({
        queryKey: ["chat", "groups", circleId, "messages"],
      });
      await queryClient.cancelQueries({ queryKey: ["chat", "groups", "list"] });

      const previousMessages = queryClient.getQueryData([
        "chat",
        "groups",
        circleId,
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
        chatGroupId: circleId,
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
        ["circles", circleId, "messages"],
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
        ["circles", "list"],
        (oldGroups) => {
          if (!oldGroups) return oldGroups;
          return oldGroups.map((g) =>
            g.id === circleId ? { ...g, latestMessage: optimisticMessage } : g,
          );
        },
      );

      return { previousMessages, previousGroups };
    },

    onError: (_err, _newMessage, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(
          ["circles", circleId, "messages"],
          context.previousMessages,
        );
      }
      if (context?.previousGroups) {
        queryClient.setQueryData(["circles", "list"], context.previousGroups);
      }
      toast.error("Failed to send message");
    },

    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["circles", circleId, "messages"],
        refetchType: "none",
      });
    },
  });
};

export const useDeleteChatMessageMutation = (circleId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: number) => deleteCircleMessage(circleId, messageId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["circles", circleId, "messages"],
      });
    },
  });
};
