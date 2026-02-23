import { Router } from "express";

import {
  addMember,
  getGroupMembers,
  removeMember,
  updateMemberRole,
  updateLastReadAt,
} from "../../controllers/chat/index.js";
import {
  enrichChatRole,
  requireMembership,
} from "../../features/chat/security/middleware.js";

const router = Router();

router.post("/:circleId/members", enrichChatRole, addMember);
router.get("/:circleId/members", requireMembership, getGroupMembers);
router.delete("/:circleId/members/:userId", enrichChatRole, removeMember);
router.patch("/:circleId/members/:userId", enrichChatRole, updateMemberRole);
router.post("/:circleId/members/me/read", updateLastReadAt);

export default router;
