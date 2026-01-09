import { useEffect } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { getNotifications } from "@/api/notification.api";
import { useNotificationStore } from "@/stores/notification.store";

export const useInitializeNotifications = (enabled: boolean = true) => {
  const queryClient = useQueryClient();
  const resetUnreadCount = useNotificationStore((state) => state.resetUnread);

  useEffect(() => {
    if (!enabled) return;

    const initializeNotifications = async () => {
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
          staleTime: 1000 * 60 * 5,
        });

        if (data?.pages[0]?.unreadCount !== undefined) {
          resetUnreadCount(data.pages[0].unreadCount);
        }
      } catch (error) {
        console.error("Failed to initialize notifications:", error);
      }
    };

    void initializeNotifications();
  }, [enabled, queryClient, resetUnreadCount]);
};
