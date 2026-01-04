import { bindMethods } from "../../../utils/bindMethods.util.js";

import NotificationCommandService from "./core/NotificationCommandService.js";
import NotificationQueryService from "./core/NotificationQueryService.js";

/**
 * Main facade for notification operations.
 * Delegates to specialized services for different concerns.
 */
class NotificationService {
  // Query Operations
  static getUserNotifications: typeof NotificationQueryService.getUserNotifications;
  static getUnreadCount: typeof NotificationQueryService.getUnreadCount;
  static getNotificationById: typeof NotificationQueryService.getNotificationById;

  // Command Operations
  static createNotification: typeof NotificationCommandService.createNotification;
  static markAsRead: typeof NotificationCommandService.markAsRead;
  static markAllAsRead: typeof NotificationCommandService.markAllAsRead;
  static deleteNotification: typeof NotificationCommandService.deleteNotification;
  static deleteAllNotifications: typeof NotificationCommandService.deleteAllNotifications;
  static deleteReadNotifications: typeof NotificationCommandService.deleteReadNotifications;

  static {
    Object.assign(
      this,
      bindMethods(NotificationQueryService, [
        "getUserNotifications",
        "getUnreadCount",
        "getNotificationById",
      ]),
      bindMethods(NotificationCommandService, [
        "createNotification",
        "markAsRead",
        "markAllAsRead",
        "deleteNotification",
        "deleteAllNotifications",
        "deleteReadNotifications",
      ])
    );
  }
}

export default NotificationService;
