import { createLogger } from "../core/config/logger.js";
import NotificationService from "../features/notification/service/NotificationService.js";
import createActionLogger from "../utils/logger.util.js";
import { createPaginationSchema } from "../utils/pagination.util.js";
import {
  NotificationsQuerySchema,
  NotificationIdParamSchema,
} from "../zodSchemas/notification.zod.js";

import type { AuthenticatedRequest } from "../types/AuthRequest.js";
import type { NextFunction, Request, Response } from "express";

const controllerLogger = createLogger({ module: "NotificationController" });

const getNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "getNotifications",
    req
  );
  try {
    actionLogger.info("Fetching notifications");

    const { user } = req as AuthenticatedRequest;

    const customValidator = createPaginationSchema(10, 50, "number");
    const { limit, cursor } = customValidator.parse(req.query);

    const parsed = NotificationsQuerySchema.parse({
      read: req.query.read,
      type: req.query.type,
    });

    const result = await NotificationService.getUserNotifications(
      user.id,
      limit,
      cursor as number | undefined,
      parsed
    );

    actionLogger.info(
      {
        userId: user.id,
        notificationCount: result.data.length,
        unreadCount: result.unreadCount,
      },
      "Notifications fetched"
    );

    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

const markNotificationAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "markNotificationAsRead",
    req
  );

  try {
    actionLogger.info("Marking notification as read");

    const { user } = req as AuthenticatedRequest;
    const { id } = NotificationIdParamSchema.parse(req.params);

    await NotificationService.markAsRead(id, user);

    actionLogger.info(
      {
        userId: user.id,
        notificationId: id,
      },
      "Notification marked as read"
    );

    return res.status(200).json({
      message: "Notification marked as read",
    });
  } catch (error) {
    return next(error);
  }
};

const markAllNotificationsAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const actionLogger = createActionLogger(
    controllerLogger,
    "markAllNotificationsAsRead",
    req
  );

  try {
    actionLogger.info("Marking all notifications as read");

    const { user } = req as AuthenticatedRequest;

    await NotificationService.markAllAsRead(user.id);

    actionLogger.info(
      {
        userId: user.id,
      },
      "All notifications marked as read"
    );

    return res.status(200).json({
      message: "All notifications marked as read",
    });
  } catch (error) {
    return next(error);
  }
};

export { getNotifications, markNotificationAsRead, markAllNotificationsAsRead };
