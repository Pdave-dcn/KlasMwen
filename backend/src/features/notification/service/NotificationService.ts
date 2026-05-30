import {
  notificationCommandService,
  type NotificationCommandService,
} from "./core/NotificationCommandService.js";
import {
  notificationQueryService,
  type NotificationQueryService,
} from "./core/NotificationQueryService.js";

class NotificationService {
  constructor(
    readonly query: NotificationQueryService,
    readonly command: NotificationCommandService,
  ) {}
}

const notificationService = new NotificationService(
  notificationQueryService,
  notificationCommandService,
);

export { notificationService, type NotificationService };
