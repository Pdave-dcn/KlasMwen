import {
  useQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { toast } from "sonner";

import {
  updateStudyCircle,
  deleteStudyCircle,
  getCirclePreviewDetails,
  getUserStudyCircles,
  getStudyCircleById,
  getRecentActivityCircles,
  createStudyCircle,
  joinStudyCircle,
} from "@/api/circle";
import type {
  CreateChatGroupData,
  UpdateChatGroupData,
  ChatGroupsForDiscoveryResponseSchema,
} from "@/zodSchemas/chat.zod";

// Queries

export const useStudyCirclesQuery = () => {
  return useQuery({
    queryKey: ["circles", "list"],
    queryFn: getUserStudyCircles,
  });
};

export const useStudyCircleQuery = (circleId: string) => {
  return useQuery({
    queryKey: ["circles", "single", circleId],
    queryFn: () => getStudyCircleById(circleId),
    enabled: !!circleId,
  });
};

export const useRecentActivityCirclesQuery = (limit = 8) => {
  return useQuery({
    queryKey: ["circles", "recent-activity", limit],
    queryFn: () => getRecentActivityCircles(limit),
  });
};

export const useCirclePreviewDetailsQuery = (circleId: string) => {
  return useQuery({
    queryKey: ["circles", circleId, "preview"],
    queryFn: () => getCirclePreviewDetails(circleId),
    enabled: !!circleId,
  });
};

// Mutations

export const useCreateStudyCircleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateChatGroupData) => createStudyCircle(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["circles", "list"],
      });
    },
  });
};

export const useJoinCircleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (circleId: string) => joinStudyCircle(circleId),
    onSuccess: async (_data, circleId) => {
      toast.success("Successfully joined the study circle!");

      await queryClient.invalidateQueries({
        queryKey: ["circles", "list"],
      });

      queryClient.setQueryData<
        InfiniteData<ChatGroupsForDiscoveryResponseSchema>
      >(["circles", "discovery"], (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data.map((group) =>
              group.id === circleId ? { ...group, isJoined: true } : group,
            ),
          })),
        };
      });
    },
  });
};

export const useUpdateCircleMutation = (circleId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateChatGroupData) =>
      updateStudyCircle(circleId, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["circles", "list"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["circles", "single", circleId],
      });
    },
  });
};

export const useDeleteCircleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (circleId: string) => deleteStudyCircle(circleId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["circles", "list"],
      });
    },
  });
};
