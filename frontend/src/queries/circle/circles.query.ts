import {
  useQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
  useInfiniteQuery,
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
  getCircleAvatars,
  leaveStudyCircle,
} from "@/api/circle";
import type {
  CreateStudyCircleData,
  EditCircleInfoValues,
  StudyCircle,
  StudyCirclesForDiscoveryResponseSchema,
} from "@/zodSchemas/circle.zod";

// Queries

export const useStudyCirclesQuery = () => {
  return useQuery({
    queryKey: ["circles", "list"],
    queryFn: getUserStudyCircles,
  });
};

export const useStudyCircleQuery = (circleId: string | null) => {
  return useQuery({
    queryKey: ["circles", "single", circleId],
    queryFn: () => getStudyCircleById(circleId as string),
    enabled: !!circleId,
  });
};

export const useRecentActivityCirclesQuery = (limit = 8) => {
  return useQuery({
    queryKey: ["circles", "recent-activity"],
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

export const useCircleAvatarsQuery = (limit = 20) => {
  return useInfiniteQuery({
    queryKey: ["circles", "avatars", limit],
    queryFn: ({ pageParam }: { pageParam?: number | string }) =>
      getCircleAvatars(limit, pageParam),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.nextCursor
        : undefined;
    },
  });
};

// Mutations

export const useCreateStudyCircleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateStudyCircleData) => createStudyCircle(data),
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
        InfiniteData<StudyCirclesForDiscoveryResponseSchema>
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

      await queryClient.invalidateQueries({
        queryKey: ["circles", "recent-activity"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["circles", "stats", "quick"],
      });
    },
  });
};

export const useLeaveCircleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (circleId: string | null) => {
      if (!circleId) {
        throw new Error("Circle ID is required to leave a circle.");
      }
      return leaveStudyCircle(circleId);
    },
    onMutate: async (circleId) => {
      await queryClient.cancelQueries({ queryKey: ["circles", "list"] });

      const previousCircles = queryClient.getQueryData<StudyCircle[]>([
        "circles",
        "list",
      ]);

      queryClient.setQueryData<StudyCircle[]>(["circles", "list"], (old) => {
        if (!old) return old;
        return old.filter((circle) => circle.id !== circleId);
      });

      return { previousCircles };
    },

    onError: (_error, _var, context) => {
      toast.error("Failed to leave the circle. Please try again.");
      queryClient.setQueryData(["circles", "list"], context?.previousCircles);
    },

    onSettled: async (_data, _error) => {
      await queryClient.invalidateQueries({
        queryKey: ["circles", "list"],
      });
    },
  });
};

export const useUpdateCircleMutation = (circleId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: EditCircleInfoValues) =>
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

    onMutate: async (circleId) => {
      await queryClient.cancelQueries({ queryKey: ["circles", "list"] });

      const previousCircles = queryClient.getQueryData<StudyCircle[]>([
        "circles",
        "list",
      ]);

      queryClient.setQueryData<StudyCircle[]>(["circles", "list"], (old) => {
        if (!old) return old;
        return old.filter((circle) => circle.id !== circleId);
      });

      return { previousCircles };
    },

    onError: (_error, _circleId, context) => {
      if (context?.previousCircles) {
        queryClient.setQueryData(["circles", "list"], context.previousCircles);
      }
    },

    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["circles", "list"],
      });
    },
  });
};
