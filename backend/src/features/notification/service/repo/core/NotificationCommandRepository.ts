import prisma from "../../../../../core/config/db.js";

import type { CreateNotificationData } from "../../types/NotificationTypes.js";

/**
 * NotificationCommandRepository - Write operations only
 */
class NotificationCommandRepository {
  /**
   * Create a new notification
   */
  static create(data: CreateNotificationData) {
    return prisma.notification.create({
      data: {
        type: data.type,
        user: { connect: { id: data.userId } },
        actor: { connect: { id: data.actorId } },
        ...(data.postId && { post: { connect: { id: data.postId } } }),
        ...(data.commentId && { comment: { connect: { id: data.commentId } } }),
      },
      select: {
        id: true,
        type: true,
        userId: true,
      },
    });
  }

  /**
   * Mark a notification as read
   */
  static markAsRead(notificationId: number) {
    return prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  static markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: { read: true },
    });
  }

  /**
   * Delete a notification
   */
  static delete(notificationId: number) {
    return prisma.notification.delete({
      where: { id: notificationId },
    });
  }

  /**
   * Delete all notifications for a user
   */
  static deleteAll(userId: string) {
    return prisma.notification.deleteMany({
      where: { userId },
    });
  }

  /**
   * Delete read notifications for a user
   */
  static deleteRead(userId: string) {
    return prisma.notification.deleteMany({
      where: {
        userId,
        read: true,
      },
    });
  }
}

export default NotificationCommandRepository;
