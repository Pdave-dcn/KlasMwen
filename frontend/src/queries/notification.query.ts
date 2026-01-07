import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getNotifications,
  markAllNotificationAsRead,
  markNotificationAsRead,
} from "@/api/notification.api";
import type {
  NotificationFilters,
  NotificationsResponse,
} from "@/zodSchemas/notification.zod";

const useNotificationsQuery = (
  limit: number = 20,
  filters?: NotificationFilters
) => {
  return useInfiniteQuery({
    queryKey: ["notifications", "fetch", filters],
    queryFn: ({ pageParam }: { pageParam?: string | number }) => {
      return getNotifications({
        cursor: pageParam as number | undefined,
        limit,
        ...filters,
      });
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.nextCursor
        : undefined;
    },
  });
};

const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationAsRead,
    onMutate: async (notificationId: number) => {
      await queryClient.cancelQueries({
        queryKey: ["notifications", "fetch"],
      });

      const previousData = queryClient.getQueriesData<NotificationsResponse>({
        queryKey: ["notifications", "fetch"],
      });

      queryClient.setQueriesData<{ pages: NotificationsResponse[] }>(
        { queryKey: ["notifications", "fetch"] },
        (old) => {
          if (!old) return old;

          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data.map((notification) =>
                notification.id === notificationId
                  ? { ...notification, read: true }
                  : notification
              ),
              unreadCount: Math.max(
                0,
                page.unreadCount -
                  (page.data.find((n) => n.id === notificationId)?.read ? 0 : 1)
              ),
            })),
          };
        }
      );

      return { previousData };
    },
    onError: (_err, _notificationId, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["notifications", "fetch"],
      });
    },
  });
};

const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationAsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: ["notifications", "fetch"],
      });

      const previousData = queryClient.getQueriesData<NotificationsResponse>({
        queryKey: ["notifications", "fetch"],
      });

      queryClient.setQueriesData<{ pages: NotificationsResponse[] }>(
        { queryKey: ["notifications", "fetch"] },
        (old) => {
          if (!old) return old;

          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data.map((notification) => ({
                ...notification,
                read: true,
              })),
              unreadCount: 0,
            })),
          };
        }
      );

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["notifications", "fetch"],
      });
    },
  });
};

export {
  useNotificationsQuery,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
};
