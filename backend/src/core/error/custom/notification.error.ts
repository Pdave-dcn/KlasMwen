import BaseCustomError from "./base.error.js";

class NotificationNotFoundError extends BaseCustomError {
  statusCode = 404;
  constructor(notificationId: number) {
    super(`Notification with ID "${notificationId}" not found`);
  }
}

export { NotificationNotFoundError };
