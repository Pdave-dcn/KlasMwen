import { NotificationNotFoundError } from "../../../../core/error/custom/notification.error.js";
import { assertPermission } from "../../../../core/security/rbac.js";
import NotificationRepository from "../repo/NotificationRepository.js";

import type { CreateNotificationData } from "../types/NotificationTypes.js";
import type { Application } from "express";

class NotificationCommandService {
  async createNotification(
    data: CreateNotificationData,
    app?: Application
  ) {
    if (data.userId === data.actorId) {
      return null;
    }

    const notification = await NotificationRepository.create(data);

    if (app) {
      const io = app.get("io");

      if (io) {
        io.to(`user:${data.userId}`).emit("notification:new", notification);
      }
    }

    return notification;
  }

  async markAsRead(notificationId: number, user: Express.User) {
    const notification = await NotificationRepository.exists(notificationId);

    if (!notification) {
      throw new NotificationNotFoundError(notificationId);
    }

    assertPermission(user, "notifications", "update", notification);

    return await NotificationRepository.markAsRead(notificationId);
  }

  async markAllAsRead(userId: string) {
    return await NotificationRepository.markAllAsRead(userId);
  }

  async deleteNotification(notificationId: number, user: Express.User) {
    const notification = await NotificationRepository.exists(notificationId);

    if (!notification) {
      throw new NotificationNotFoundError(notificationId);
    }

    assertPermission(user, "notifications", "delete", notification);

    return await NotificationRepository.delete(notificationId);
  }

  async deleteAllNotifications(userId: string) {
    return await NotificationRepository.deleteAll(userId);
  }

  async deleteReadNotifications(userId: string) {
    return await NotificationRepository.deleteRead(userId);
  }
}

const notificationCommandService = new NotificationCommandService();
export { notificationCommandService, NotificationCommandService };
