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

    const result = await notificationService.getUserNotifications(
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

    await notificationService.markAsRead(id, req.user);

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
    await notificationService.markAllAsRead(req.user.id);

    log.info("All notifications marked as read");

    res.status(200).json({
      message: "All notifications marked as read",
    });
  },
);

export { getNotifications, markNotificationAsRead, markAllNotificationsAsRead };
