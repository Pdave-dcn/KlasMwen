import { Router } from "express";

import {
  deleteMessage,
  getMessages,
  sendMessage,
} from "../../controllers/chat/index.js";
import {
  enrichChatRole,
  requireMembership,
} from "../../features/chat/security/middleware.js";

const router = Router();

router.post("/:chatGroupId/message", requireMembership, sendMessage);
router.get("/:chatGroupId/messages", requireMembership, getMessages);
router.delete("/:chatGroupId/messages/:id", enrichChatRole, deleteMessage);

export default router;
