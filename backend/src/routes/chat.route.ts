import { Router } from "express";

import {
  createChatGroup,
  deleteGroup,
  getGroupById,
  getUserGroups,
  updateGroup,
  addMember,
  getGroupMembers,
  removeMember,
  updateMemberRole,
  deleteMessage,
  getMessages,
  sendMessage,
} from "../controllers/chat/index.js";
import {
  enrichChatRole,
  requireMembership,
} from "../features/chat/security/middleware.js";
import { generalApiLimiter } from "../middleware/coreRateLimits.middleware.js";
import { requireAuth } from "../middleware/requireAuth.middleware.js";

const router = Router();

router.use(generalApiLimiter);
router.use(requireAuth);

router.post("/", createChatGroup);

router.get("/", getUserGroups);

router.get("/:chatGroupId", enrichChatRole, getGroupById);

router.put("/:chatGroupId", enrichChatRole, updateGroup);

router.delete("/:chatGroupId", enrichChatRole, deleteGroup);

router.post("/:chatGroupId/members", enrichChatRole, addMember);

router.get("/:chatGroupId/members", requireMembership, getGroupMembers);

router.delete("/:chatGroupId/members/:userId", enrichChatRole, removeMember);

router.patch("/:chatGroupId/members/:userId", enrichChatRole, updateMemberRole);

router.post("/:chatGroupId/messages", requireMembership, sendMessage);

router.get("/:chatGroupId/messages", requireMembership, getMessages);

router.delete("/:chatGroupId/messages/:id", enrichChatRole, deleteMessage);

export default router;
