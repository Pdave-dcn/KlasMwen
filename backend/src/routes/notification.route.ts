import express from "express";

import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../controllers/notification.controller.js";
import {
  generalApiLimiter,
  notificationReadLimiter,
  notificationWriteLimiter,
} from "../middleware/coreRateLimits.middleware.js";
import attachLogContext from "../middleware/logContext.middleware.js";
import { requireAuth } from "../middleware/requireAuth.middleware.js";

const router = express.Router();

router.use(attachLogContext("notificationController"));
router.use(generalApiLimiter);
router.use(requireAuth);

router.get("/", notificationReadLimiter, getNotifications);

router.patch("/:id/read", notificationWriteLimiter, markNotificationAsRead);
router.patch("/read-all", notificationWriteLimiter, markAllNotificationsAsRead);

export default router;
