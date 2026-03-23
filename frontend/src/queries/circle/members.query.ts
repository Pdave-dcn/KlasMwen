import {
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  type InfiniteData,
} from "@tanstack/react-query";
import { toast } from "sonner";

import {
  addCircleMember,
  getCircleMembers,
  removeCircleMember,
  updateCircleMemberRole,
  updateCircleMemberLastReadAt,
  setCircleMemberMute,
} from "@/api/circle";
import type { MuteDuration } from "@/features/study-circles/settings/types";
import type {
  AddMemberData,
  CircleMember,
  CircleMembersResponse,
  UpdateMemberRoleData,
} from "@/zodSchemas/circle.zod";

// Queries

export const useCircleMembersQuery = (circleId: string | null, limit = 15) => {
  return useInfiniteQuery({
    queryKey: ["circles", circleId, "members"],
    queryFn: ({ pageParam }) =>
      getCircleMembers(circleId as string, limit, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.nextCursor
        : undefined;
    },
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

export const useRemoveCircleMemberMutation = (circleId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => {
      if (!circleId)
        throw new Error("Circle ID is required to remove a member.");
      return removeCircleMember(circleId, userId);
    },

    onMutate: async (userId) => {
      await queryClient.cancelQueries({
        queryKey: ["circles", circleId, "members"],
      });

      const previousMembers = queryClient.getQueryData<
        InfiniteData<CircleMembersResponse>
      >(["circles", circleId, "members"]);

      queryClient.setQueryData<InfiniteData<CircleMembersResponse>>(
        ["circles", circleId, "members"],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data.filter((member) => member.userId !== userId),
            })),
          };
        },
      );

      return { previousMembers };
    },

    onError: (_error, _userId, context) => {
      if (context?.previousMembers) {
        queryClient.setQueryData(
          ["circles", circleId, "members"],
          context.previousMembers,
        );
      }
      toast.error("Failed to remove member. Please try again.");
    },

    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["circles", circleId, "members"],
      });
    },
  });
};

export const useUpdateCircleMemberRoleMutation = (circleId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: string;
      data: UpdateMemberRoleData;
    }) => {
      if (!circleId) {
        throw new Error("Circle ID is required to update member role.");
      }
      return updateCircleMemberRole(circleId, userId, data);
    },

    onMutate: async ({ userId, data: { role } }) => {
      await queryClient.cancelQueries({
        queryKey: ["circles", circleId, "members"],
      });

      const previousMembers = queryClient.getQueryData<CircleMember[]>([
        "circles",
        circleId,
        "members",
      ]);

      queryClient.setQueryData<CircleMember[]>(
        ["circles", circleId, "members"],
        (old) => {
          if (!old) return old;
          return old.map((member) =>
            member.userId === userId ? { ...member, role } : member,
          );
        },
      );

      return { previousMembers };
    },

    onError: (_error, _variables, context) => {
      if (context?.previousMembers) {
        queryClient.setQueryData(
          ["circles", circleId, "members"],
          context.previousMembers,
        );
      }
      toast.error("Failed to update member role. Please try again.");
    },

    onSettled: async () => {
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

export const useSetCircleMemberMuteMutation = (circleId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      muted,
      duration,
    }: {
      userId: string;
      muted: boolean;
      duration?: MuteDuration["value"];
    }) => setCircleMemberMute(circleId, userId, muted, duration),

    onMutate: async ({ userId, muted }) => {
      await queryClient.cancelQueries({
        queryKey: ["circles", circleId, "members"],
      });

      const previousMembers = queryClient.getQueryData<CircleMember[]>([
        "circles",
        circleId,
        "members",
      ]);

      queryClient.setQueryData<CircleMember[]>(
        ["circles", circleId, "members"],
        (old) => {
          if (!old) return old;
          return old.map((member) =>
            member.userId === userId ? { ...member, isMuted: muted } : member,
          );
        },
      );

      return { previousMembers };
    },

    onError: (_error, _variables, context) => {
      if (context?.previousMembers) {
        queryClient.setQueryData(
          ["circles", circleId, "members"],
          context.previousMembers,
        );
      }
      toast.error("Failed to update mute status. Please try again.");
    },

    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["circles", circleId, "members"],
      });
    },
  });
};
