import {
  notificationCommandService,
  type NotificationCommandService,
} from "./core/NotificationCommandService.js";
import {
  notificationQueryService,
  type NotificationQueryService,
} from "./core/NotificationQueryService.js";

import type { CreateNotificationData } from "./types/NotificationTypes.js";
import type { NotificationType } from "@prisma/client";
import type { Application } from "express";

class NotificationService {
  constructor(
    private readonly query: NotificationQueryService,
    private readonly command: NotificationCommandService,
  ) {}

  getUserNotifications(
    userId: string,
    limit = 20,
    cursor?: number,
    filters?: { read?: boolean; type?: NotificationType },
  ) {
    return this.query.getUserNotifications(userId, limit, cursor, filters);
  }

  getUnreadCount(userId: string) {
    return this.query.getUnreadCount(userId);
  }

  getNotificationById(notificationId: number) {
    return this.query.getNotificationById(notificationId);
  }

  createNotification(data: CreateNotificationData, app?: Application) {
    return this.command.createNotification(data, app);
  }

  markAsRead(notificationId: number, user: Express.User) {
    return this.command.markAsRead(notificationId, user);
  }

  markAllAsRead(userId: string) {
    return this.command.markAllAsRead(userId);
  }

  deleteNotification(notificationId: number, user: Express.User) {
    return this.command.deleteNotification(notificationId, user);
  }

  deleteAllNotifications(userId: string) {
    return this.command.deleteAllNotifications(userId);
  }

  deleteReadNotifications(userId: string) {
    return this.command.deleteReadNotifications(userId);
  }
}

const notificationService = new NotificationService(
  notificationQueryService,
  notificationCommandService,
);

export { notificationService, NotificationService };
