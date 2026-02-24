import { Router } from "express";

import {
  deleteMessage,
  getMessages,
  sendMessage,
} from "../../controllers/circle/index.js";
import {
  enrichChatRole,
  requireMembership,
} from "../../features/chat/security/middleware.js";

const router = Router();

router.post("/:circleId/message", requireMembership, sendMessage);
router.get("/:circleId/messages", requireMembership, getMessages);
router.delete("/:circleId/messages/:id", enrichChatRole, deleteMessage);

export default router;
