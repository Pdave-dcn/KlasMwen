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

router.post("/:chatGroupId/members", enrichChatRole, addMember);
router.get("/:chatGroupId/members", requireMembership, getGroupMembers);
router.delete("/:chatGroupId/members/:userId", enrichChatRole, removeMember);
router.patch("/:chatGroupId/members/:userId", enrichChatRole, updateMemberRole);
router.post("/:chatGroupId/members/me/read", updateLastReadAt);

export default router;
