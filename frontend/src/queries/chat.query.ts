import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";

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
  sendChatMessage,
  getChatMessages,
  deleteChatMessage,
} from "@/api/chat.api";
import type {
  CreateChatGroupData,
  UpdateChatGroupData,
  AddMemberData,
  UpdateMemberRoleData,
  SendMessageData,
} from "@/zodSchemas/chat.zod";

// Chat Group Queries

const useChatGroupsQuery = () => {
  return useQuery({
    queryKey: ["chat", "groups"],
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

// Chat Group Mutations

const useCreateChatGroupMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateChatGroupData) => createChatGroup(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["chat", "groups"] });
    },
  });
};

const useUpdateChatGroupMutation = (chatGroupId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateChatGroupData) =>
      updateChatGroup(chatGroupId, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["chat", "groups"] });
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
      await queryClient.invalidateQueries({ queryKey: ["chat", "groups"] });
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

const useSendChatMessageMutation = (chatGroupId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SendMessageData) => sendChatMessage(chatGroupId, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["chat", "groups", chatGroupId, "messages"],
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
  useCreateChatGroupMutation,
  useUpdateChatGroupMutation,
  useDeleteChatGroupMutation,
  // Members
  useChatMembersQuery,
  useAddChatMemberMutation,
  useRemoveChatMemberMutation,
  useUpdateChatMemberRoleMutation,
  // Messages
  useChatMessagesQuery,
  useSendChatMessageMutation,
  useDeleteChatMessageMutation,
};
