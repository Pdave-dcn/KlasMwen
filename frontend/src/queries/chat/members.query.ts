import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  addChatMember,
  getChatMembers,
  removeChatMember,
  updateChatMemberRole,
  updateChatMemberLastReadAt,
} from "@/api/chat";
import type {
  AddMemberData,
  UpdateMemberRoleData,
} from "@/zodSchemas/chat.zod";

// Queries

export const useChatMembersQuery = (chatGroupId: string) => {
  return useQuery({
    queryKey: ["chat", "groups", chatGroupId, "members"],
    queryFn: () => getChatMembers(chatGroupId),
    enabled: !!chatGroupId,
  });
};

// Mutations

export const useAddChatMemberMutation = (chatGroupId: string) => {
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

export const useRemoveChatMemberMutation = (chatGroupId: string) => {
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

export const useUpdateChatMemberRoleMutation = (chatGroupId: string) => {
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

export const useUpdateChatMemberLastReadAtMutation = () => {
  return useMutation({
    mutationFn: (chatGroupId: string) =>
      updateChatMemberLastReadAt(chatGroupId),
  });
};
