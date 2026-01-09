import { useEffect } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { getNotifications } from "@/api/notification.api";
import { useNotificationStore } from "@/stores/notification.store";

export const usePrefetchNotifications = () => {
  const queryClient = useQueryClient();
  const resetUnreadCount = useNotificationStore((state) => state.resetUnread);

  useEffect(() => {
    const prefetchAndSync = async () => {
      try {
        const data = await queryClient.fetchInfiniteQuery({
          queryKey: ["notifications", "fetch", undefined],
          queryFn: ({ pageParam }) => {
            return getNotifications({
              cursor: pageParam as number | undefined,
              limit: 20,
            });
          },
          initialPageParam: undefined,
        });

        // Sync unread count to store after fetching
        if (data?.pages[0]?.unreadCount !== undefined) {
          resetUnreadCount(data.pages[0].unreadCount);
        }
      } catch (error) {
        console.error("Failed to prefetch notifications:", error);
      }
    };

    void prefetchAndSync();
  }, [queryClient, resetUnreadCount]);
};
