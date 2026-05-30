import { NotificationNotFoundError } from "../../../../core/error/custom/notification.error.js";
import {
  permissionService as defaultPermissionService,
  type PermissionService,
} from "../../../../core/security/PermissionService.js";
import NotificationRepository from "../repo/NotificationRepository.js";

import { notificationEmitter } from "./NotificationEmitter.js";

import type { CreateNotificationData } from "../types/NotificationTypes.js";

class NotificationCommandService {
  constructor(
    private permission: PermissionService = defaultPermissionService,
  ) {}

  async createNotification(data: CreateNotificationData) {
    const notification = await NotificationRepository.create(data);

    notificationEmitter.emit(data.userId, "notification:new", notification);

    return notification;
  }

  async markAsRead(notificationId: number, user: Express.User) {
    const notification = await NotificationRepository.exists(notificationId);

    if (!notification) {
      throw new NotificationNotFoundError(notificationId);
    }

    this.permission.assertCanUpdateNotification(user, notification);

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

    this.permission.assertCanDeleteNotification(user, notification);

    return await NotificationRepository.delete(notificationId);
  }

  async deleteAllNotifications(userId: string) {
    return await NotificationRepository.deleteAll(userId);
  }

  async deleteReadNotifications(userId: string) {
    return await NotificationRepository.deleteRead(userId);
  }
}

const notificationCommandService = new NotificationCommandService(
  defaultPermissionService,
);
export { notificationCommandService, NotificationCommandService };
