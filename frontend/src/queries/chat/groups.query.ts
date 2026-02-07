import {
  useQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createChatGroup,
  getUserChatGroups,
  getChatGroupById,
  updateChatGroup,
  deleteChatGroup,
  joinChatGroup,
  getRecentActivityGroups,
} from "@/api/chat";
import type {
  CreateChatGroupData,
  UpdateChatGroupData,
  ChatGroupsForDiscoveryResponseSchema,
} from "@/zodSchemas/chat.zod";

// Queries

export const useChatGroupsQuery = () => {
  return useQuery({
    queryKey: ["chat", "groups", "list"],
    queryFn: getUserChatGroups,
  });
};

export const useChatGroupQuery = (chatGroupId: string) => {
  return useQuery({
    queryKey: ["chat", "groups", chatGroupId],
    queryFn: () => getChatGroupById(chatGroupId),
    enabled: !!chatGroupId,
  });
};

export const useRecentActivityGroupsQuery = (limit = 8) => {
  return useQuery({
    queryKey: ["chat", "groups", "recent-activity", limit],
    queryFn: () => getRecentActivityGroups(limit),
  });
};

// Mutations

export const useCreateChatGroupMutation = () => {
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

export const useJoinChatGroupMutation = () => {
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

export const useUpdateChatGroupMutation = (chatGroupId: string) => {
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

export const useDeleteChatGroupMutation = () => {
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
