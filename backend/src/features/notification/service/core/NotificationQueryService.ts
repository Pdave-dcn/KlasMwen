import { processPaginatedResults } from "../../../../utils/pagination.util.js";
import NotificationRepository from "../repo/NotificationRepository.js";

import type { NotificationFilters } from "../types/NotificationTypes.js";
import type { NotificationType } from "@prisma/client";

class NotificationQueryService {
  async getUserNotifications(
    userId: string,
    limit = 20,
    cursor?: number,
    filters?: { read?: boolean; type?: NotificationType }
  ) {
    const notificationFilters: NotificationFilters = {
      userId,
      ...filters,
    };

    const [notifications, unreadCount] = await Promise.all([
      NotificationRepository.findUserNotifications(
        notificationFilters,
        limit,
        cursor
      ),
      NotificationRepository.countUnread(userId),
    ]);

    const { data, pagination } = processPaginatedResults(
      notifications,
      limit,
      "id"
    );

    return {
      data,
      pagination,
      unreadCount,
    };
  }

  async getUnreadCount(userId: string) {
    return await NotificationRepository.countUnread(userId);
  }

  async getNotificationById(notificationId: number) {
    return await NotificationRepository.findById(notificationId);
  }
}

const notificationQueryService = new NotificationQueryService();
export { notificationQueryService, NotificationQueryService };
