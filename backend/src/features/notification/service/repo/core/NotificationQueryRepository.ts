import prisma from "../../../../../core/config/db.js";
import { buildPaginatedQuery } from "../../../../../utils/pagination.util.js";
import {
  BaseSelectors,
  type NotificationFilters,
} from "../../types/NotificationTypes.js";

import type { Prisma } from "@prisma/client";

/**
 * NotificationQueryRepository - Read operations only
 */
class NotificationQueryRepository {
  /**
   * Find notifications for a user with filters and pagination
   */
  static findUserNotifications(
    filters: NotificationFilters,
    limit: number,
    cursor?: number
  ) {
    const where: Prisma.NotificationWhereInput = {
      userId: filters.userId,
      ...(filters.read !== undefined && { read: filters.read }),
      ...(filters.type && { type: filters.type }),
    };

    const baseQuery: Prisma.NotificationFindManyArgs = {
      where,
      select: BaseSelectors.notification,
      orderBy: { createdAt: "desc" },
    };

    const paginatedQuery = buildPaginatedQuery<"notification">(baseQuery, {
      limit,
      cursor,
      cursorField: "id",
    });

    return prisma.notification.findMany(paginatedQuery);
  }

  /**
   * Count unread notifications for a user
   */
  static countUnread(userId: string) {
    return prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });
  }

  /**
   * Count total notifications for a user
   */
  static countTotal(userId: string) {
    return prisma.notification.count({
      where: { userId },
    });
  }

  /**
   * Find a single notification by ID
   */
  static findById(notificationId: number) {
    return prisma.notification.findUnique({
      where: { id: notificationId },
      select: BaseSelectors.notification,
    });
  }

  /**
   * Check if notification exists
   */
  static exists(notificationId: number) {
    return prisma.notification.findUnique({
      where: { id: notificationId },
      select: {
        id: true,
        userId: true,
      },
    });
  }
}

export default NotificationQueryRepository;
