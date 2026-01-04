import { NotificationNotFoundError } from "../../../../core/error/custom/notification.error.js";
import { assertPermission } from "../../../../core/security/rbac.js";
import NotificationRepository from "../repo/NotificationRepository.js";

import type { CreateNotificationData } from "../types/NotificationTypes.js";

/**
 * NotificationCommandService - Write operations only
 */
class NotificationCommandService {
  /**
   * Create a new notification
   * Prevents users from sending notifications to themselves
   */
  static async createNotification(data: CreateNotificationData) {
    // Don't create notification if user is notifying themselves
    if (data.userId === data.actorId) {
      return null;
    }

    return await NotificationRepository.create(data);
  }

  /**
   * Mark a notification as read
   */
  static async markAsRead(notificationId: number, user: Express.User) {
    const notification = await NotificationRepository.exists(notificationId);

    if (!notification) {
      throw new NotificationNotFoundError(notificationId);
    }

    assertPermission(user, "notifications", "update", notification);

    return await NotificationRepository.markAsRead(notificationId);
  }

  /**
   * Mark all notifications as read for a user
   * No permission check needed as users can only mark their own notifications
   */
  static async markAllAsRead(userId: string) {
    return await NotificationRepository.markAllAsRead(userId);
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(notificationId: number, user: Express.User) {
    const notification = await NotificationRepository.exists(notificationId);

    if (!notification) {
      throw new NotificationNotFoundError(notificationId);
    }

    assertPermission(user, "notifications", "delete", notification);

    return await NotificationRepository.delete(notificationId);
  }

  /**
   * Delete all notifications for a user
   * No permission check needed as users can only delete their own notifications
   */
  static async deleteAllNotifications(userId: string) {
    return await NotificationRepository.deleteAll(userId);
  }

  /**
   * Delete all read notifications for a user
   * No permission check needed as users can only delete their own notifications
   */
  static async deleteReadNotifications(userId: string) {
    return await NotificationRepository.deleteRead(userId);
  }
}

export default NotificationCommandService;
