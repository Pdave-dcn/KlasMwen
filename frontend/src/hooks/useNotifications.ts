import { useEffect, useState } from "react";

import {
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useNotificationsQuery,
} from "@/queries/notification.query";
import { useNotificationStore } from "@/stores/notification.store";
import type { NotificationType } from "@/zodSchemas/notification.zod";

export type ReadFilter = "all" | "unread" | "read";

export const useNotifications = (limit: number = 20) => {
  const [readFilter, setReadFilter] = useState<ReadFilter>("all");
  const [typeFilter, setTypeFilter] = useState<NotificationType | "all">("all");
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const resetUnreadCount = useNotificationStore((state) => state.resetUnread);

  // Build filters object for the query
  const filters = {
    type: typeFilter !== "all" ? typeFilter : undefined,
    read: readFilter !== "all" ? readFilter === "read" : undefined,
  };

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useNotificationsQuery(limit, filters);

  const notifications = data?.pages.flatMap((page) => page.data) ?? [];

  // Sync unread count from server response to store
  useEffect(() => {
    if (data?.pages[0]?.unreadCount !== undefined) {
      resetUnreadCount(data.pages[0].unreadCount);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.pages[0]?.unreadCount, resetUnreadCount]);

  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();

  const handleMarkAllRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleMarkAsRead = (id: number) => {
    markAsReadMutation.mutate(id);
  };

  const hasActiveFilters = readFilter !== "all" || typeFilter !== "all";

  return {
    // State
    readFilter,
    typeFilter,
    unreadCount,
    notifications,
    isLoading,
    isError,
    hasActiveFilters,

    // Pagination
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,

    // Actions
    setReadFilter,
    setTypeFilter,
    handleMarkAllRead,
    handleMarkAsRead,

    // Mutation states
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
  };
};
