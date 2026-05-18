import NotificationCommandRepository from "./core/NotificationCommandRepository.js";
import NotificationQueryRepository from "./core/NotificationQueryRepository.js";

import type {
  CreateNotificationData,
  NotificationFilters,
} from "../types/NotificationTypes.js";

class NotificationRepository {
  static findUserNotifications(
    filters: NotificationFilters,
    limit: number,
    cursor?: number,
  ) {
    return NotificationQueryRepository.findUserNotifications(
      filters,
      limit,
      cursor,
    );
  }

  static countUnread(userId: string) {
    return NotificationQueryRepository.countUnread(userId);
  }

  static countTotal(userId: string) {
    return NotificationQueryRepository.countTotal(userId);
  }

  static findById(notificationId: number) {
    return NotificationQueryRepository.findById(notificationId);
  }

  static exists(notificationId: number) {
    return NotificationQueryRepository.exists(notificationId);
  }

  static create(data: CreateNotificationData) {
    return NotificationCommandRepository.create(data);
  }

  static markAsRead(notificationId: number) {
    return NotificationCommandRepository.markAsRead(notificationId);
  }

  static markAllAsRead(userId: string) {
    return NotificationCommandRepository.markAllAsRead(userId);
  }

  static delete(notificationId: number) {
    return NotificationCommandRepository.delete(notificationId);
  }

  static deleteAll(userId: string) {
    return NotificationCommandRepository.deleteAll(userId);
  }

  static deleteRead(userId: string) {
    return NotificationCommandRepository.deleteRead(userId);
  }
}

export default NotificationRepository;
