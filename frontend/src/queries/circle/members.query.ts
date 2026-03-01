import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  addCircleMember,
  getCircleMembers,
  removeCircleMember,
  updateCircleMemberRole,
  updateCircleMemberLastReadAt,
} from "@/api/circle";
import type {
  AddMemberData,
  UpdateMemberRoleData,
} from "@/zodSchemas/circle.zod";

// Queries

export const useCircleMembersQuery = (circleId: string) => {
  return useQuery({
    queryKey: ["circles", circleId, "members"],
    queryFn: () => getCircleMembers(circleId),
    enabled: !!circleId,
  });
};

// Mutations

export const useAddCircleMemberMutation = (circleId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddMemberData) => addCircleMember(circleId, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["circles", circleId, "members"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["circles", "single", circleId],
      });
    },
  });
};

export const useRemoveCircleMemberMutation = (circleId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => removeCircleMember(circleId, userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["circles", circleId, "members"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["circles", "single", circleId],
      });
    },
  });
};

export const useUpdateCircleMemberRoleMutation = (circleId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: string;
      data: UpdateMemberRoleData;
    }) => updateCircleMemberRole(circleId, userId, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["circles", circleId, "members"],
      });
    },
  });
};

export const useUpdateCircleMemberLastReadAtMutation = () => {
  return useMutation({
    mutationFn: (circleId: string) => updateCircleMemberLastReadAt(circleId),
  });
};
