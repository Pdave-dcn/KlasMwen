import { createLogger } from "../core/config/logger.js";
import { notificationService } from "../features/notification/service/index.js";
import { withLogging } from "../utils/logger.util.js";
import { createPaginationSchema } from "../utils/pagination.util.js";
import {
  NotificationsQuerySchema,
  NotificationIdParamSchema,
} from "../zodSchemas/notification.zod.js";

import type { AuthenticatedRequest } from "../types/AuthRequest.js";

const controllerLogger = createLogger({ module: "NotificationController" });

const getNotifications = withLogging<AuthenticatedRequest>(
  controllerLogger,
  "getNotifications",
  async ({ req, res, log }) => {
    log.info("Received request to fetch notifications");
    const customValidator = createPaginationSchema(10, 50, "number");
    const { limit, cursor } = customValidator.parse(req.query);

    const parsed = NotificationsQuerySchema.parse({
      read: req.query.read,
      type: req.query.type,
    });

    const result = await notificationService.query.getUserNotifications(
      req.user.id,
      limit,
      cursor as number | undefined,
      parsed,
    );

    log.info("Notifications fetched successfully");

    res.status(200).json(result);
  },
);

const markNotificationAsRead = withLogging<AuthenticatedRequest>(
  controllerLogger,
  "markNotificationAsRead",
  async ({ req, res, log }) => {
    log.info("Received request to mark notification as read");
    const { id } = NotificationIdParamSchema.parse(req.params);

    await notificationService.command.markAsRead(id, req.user);

    log.info("Notification marked as read");

    res.status(200).json({
      message: "Notification marked as read",
    });
  },
);

const markAllNotificationsAsRead = withLogging<AuthenticatedRequest>(
  controllerLogger,
  "markAllNotificationsAsRead",
  async ({ req, res, log }) => {
    log.info("Received request to mark all notifications as read");
    await notificationService.command.markAllAsRead(req.user.id);

    log.info("All notifications marked as read");

    res.status(200).json({
      message: "All notifications marked as read",
    });
  },
);

const deleteNotification = withLogging<AuthenticatedRequest>(
  controllerLogger,
  "deleteNotification",
  async ({ req, res, log }) => {
    log.info("Received request to delete notification");
    const { id } = NotificationIdParamSchema.parse(req.params);

    await notificationService.command.deleteNotification(id, req.user);

    log.info({ notificationId: id }, "Notification deleted successfully");
    res.status(200).json({ message: "Notification deleted successfully" });
  },
);

const deleteAllNotifications = withLogging<AuthenticatedRequest>(
  controllerLogger,
  "deleteAllNotifications",
  async ({ req, res, log }) => {
    log.info("Received request to delete all notifications");

    await notificationService.command.deleteAllNotifications(req.user.id);

    log.info("All notifications deleted successfully");
    res.status(200).json({ message: "All notifications deleted successfully" });
  },
);

const deleteReadNotifications = withLogging<AuthenticatedRequest>(
  controllerLogger,
  "deleteReadNotifications",
  async ({ req, res, log }) => {
    log.info("Received request to delete read notifications");

    await notificationService.command.deleteReadNotifications(req.user.id);

    log.info("Read notifications deleted successfully");
    res
      .status(200)
      .json({ message: "Read notifications deleted successfully" });
  },
);

export {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
  deleteReadNotifications,
};
