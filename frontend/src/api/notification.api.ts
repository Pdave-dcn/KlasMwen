import handleZodValidationError from "@/utils/zodErrorHandler.util";
import {
  NotificationsQueryParamsSchema,
  NotificationsResponseSchema,
  type NotificationParams,
} from "@/zodSchemas/notification.zod";

import api from "./api";

const getNotifications = async (params?: NotificationParams) => {
  try {
    NotificationsQueryParamsSchema.parse(params);

    const res = await api.get("/notifications", { params });
    const parsed = NotificationsResponseSchema.parse(res.data);

    return parsed;
  } catch (error) {
    handleZodValidationError(error, "getNotifications");
    throw error;
  }
};

const markNotificationAsRead = async (notificationId: number) => {
  await api.patch(`/notifications/${notificationId}/read`);
};

const markAllNotificationAsRead = async () => {
  await api.patch("/notifications/read-all");
};

export { getNotifications, markNotificationAsRead, markAllNotificationAsRead };
