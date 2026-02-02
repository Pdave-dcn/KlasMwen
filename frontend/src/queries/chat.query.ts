import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  type InfiniteData,
} from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createChatGroup,
  getUserChatGroups,
  getChatGroupById,
  updateChatGroup,
  deleteChatGroup,
  addChatMember,
  getChatMembers,
  removeChatMember,
  updateChatMemberRole,
  getChatMessages,
  deleteChatMessage,
  sendChatMessage,
  updateChatMemberLastReadAt,
  getChatGroupsForDiscovery,
  joinChatGroup,
} from "@/api/chat.api";
import type { User } from "@/types/auth.type";
import type {
  CreateChatGroupData,
  UpdateChatGroupData,
  AddMemberData,
  UpdateMemberRoleData,
  SendMessageData,
  ChatMessage,
  ChatMessagesResponse,
  ChatGroup,
  ChatGroupsForDiscoveryResponseSchema,
} from "@/zodSchemas/chat.zod";

// Chat Group Queries

const useChatGroupsQuery = () => {
  return useQuery({
    queryKey: ["chat", "groups", "list"],
    queryFn: getUserChatGroups,
  });
};

const useChatGroupQuery = (chatGroupId: string) => {
  return useQuery({
    queryKey: ["chat", "groups", chatGroupId],
    queryFn: () => getChatGroupById(chatGroupId),
    enabled: !!chatGroupId,
  });
};

const useChatGroupsForDiscoveryQuery = (limit: number = 10) => {
  return useInfiniteQuery({
    queryKey: ["chat", "groups", "discover", limit],
    queryFn: ({ pageParam }) => getChatGroupsForDiscovery(limit, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.nextCursor
        : undefined;
    },
  });
};

// Chat Group Mutations

const useCreateChatGroupMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateChatGroupData) => createChatGroup(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["chat", "groups", "list"],
      });
    },
  });
};

const useJoinChatGroupMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (chatGroupId: string) => joinChatGroup(chatGroupId),
    onSuccess: async (_data, chatGroupId) => {
      toast.success("Successfully joined the group!");

      await queryClient.invalidateQueries({
        queryKey: ["chat", "groups", "list"],
      });

      queryClient.setQueryData<
        InfiniteData<ChatGroupsForDiscoveryResponseSchema>
      >(["chat", "groups", "discovery"], (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data.map((group) =>
              group.id === chatGroupId ? { ...group, isJoined: true } : group,
            ),
          })),
        };
      });
    },
  });
};

const useUpdateChatGroupMutation = (chatGroupId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateChatGroupData) =>
      updateChatGroup(chatGroupId, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["chat", "groups", "list"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["chat", "groups", chatGroupId],
      });
    },
  });
};

const useDeleteChatGroupMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (chatGroupId: string) => deleteChatGroup(chatGroupId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["chat", "groups", "list"],
      });
    },
  });
};

// Chat Member Queries

const useChatMembersQuery = (chatGroupId: string) => {
  return useQuery({
    queryKey: ["chat", "groups", chatGroupId, "members"],
    queryFn: () => getChatMembers(chatGroupId),
    enabled: !!chatGroupId,
  });
};

// Chat Member Mutations

const useAddChatMemberMutation = (chatGroupId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddMemberData) => addChatMember(chatGroupId, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["chat", "groups", chatGroupId, "members"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["chat", "groups", chatGroupId],
      });
    },
  });
};

const useRemoveChatMemberMutation = (chatGroupId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => removeChatMember(chatGroupId, userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["chat", "groups", chatGroupId, "members"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["chat", "groups", chatGroupId],
      });
    },
  });
};

const useUpdateChatMemberRoleMutation = (chatGroupId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: string;
      data: UpdateMemberRoleData;
    }) => updateChatMemberRole(chatGroupId, userId, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["chat", "groups", chatGroupId, "members"],
      });
    },
  });
};

const useUpdateChatMemberLastReadAtMutation = () => {
  return useMutation({
    mutationFn: (chatGroupId: string) =>
      updateChatMemberLastReadAt(chatGroupId),
  });
};

// Chat Message Queries

const useChatMessagesQuery = (chatGroupId: string, limit: number = 50) => {
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

// Chat Message Mutations

/**
 * Optimistic Send Message Mutation
 * Manually updates the messages cache and group list preview before the server responds.
 */
const useSendChatMessageMutation = (
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

const useDeleteChatMessageMutation = (chatGroupId: string) => {
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

export {
  // Groups
  useChatGroupsQuery,
  useChatGroupQuery,
  useChatGroupsForDiscoveryQuery,
  useCreateChatGroupMutation,
  useUpdateChatGroupMutation,
  useDeleteChatGroupMutation,
  useJoinChatGroupMutation,
  // Members
  useChatMembersQuery,
  useAddChatMemberMutation,
  useRemoveChatMemberMutation,
  useUpdateChatMemberRoleMutation,
  useUpdateChatMemberLastReadAtMutation,
  // Messages
  useChatMessagesQuery,
  useSendChatMessageMutation,
  useDeleteChatMessageMutation,
};
