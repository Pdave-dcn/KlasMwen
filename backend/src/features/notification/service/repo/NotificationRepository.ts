import { bindMethods } from "../../../../utils/bindMethods.util.js";

import NotificationCommandRepository from "./core/NotificationCommandRepository.js";
import NotificationQueryRepository from "./core/NotificationQueryRepository.js";

/**
 * NotificationRepository - Main facade for notification data access
 */
class NotificationRepository {
  // Query Operations
  static findUserNotifications: typeof NotificationQueryRepository.findUserNotifications;
  static countUnread: typeof NotificationQueryRepository.countUnread;
  static countTotal: typeof NotificationQueryRepository.countTotal;
  static findById: typeof NotificationQueryRepository.findById;
  static exists: typeof NotificationQueryRepository.exists;

  // Command Operations
  static create: typeof NotificationCommandRepository.create;
  static markAsRead: typeof NotificationCommandRepository.markAsRead;
  static markAllAsRead: typeof NotificationCommandRepository.markAllAsRead;
  static delete: typeof NotificationCommandRepository.delete;
  static deleteAll: typeof NotificationCommandRepository.deleteAll;
  static deleteRead: typeof NotificationCommandRepository.deleteRead;

  static {
    Object.assign(
      this,
      bindMethods(NotificationQueryRepository, [
        "findUserNotifications",
        "countUnread",
        "countTotal",
        "findById",
        "exists",
      ]),
      bindMethods(NotificationCommandRepository, [
        "create",
        "markAsRead",
        "markAllAsRead",
        "delete",
        "deleteAll",
        "deleteRead",
      ])
    );
  }
}

export default NotificationRepository;
