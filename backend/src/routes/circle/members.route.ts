import { Router } from "express";

import {
  addMember,
  getCircleMembers,
  removeMember,
  updateMemberRole,
  updateLastReadAt,
} from "../../controllers/circle/index.js";
import {
  enrichCircleRole,
  requireMembership,
} from "../../features/chat/security/middleware.js";

const router = Router();

router.post("/:circleId/members", enrichCircleRole, addMember);
router.get("/:circleId/members", requireMembership, getCircleMembers);
router.delete("/:circleId/members/:userId", enrichCircleRole, removeMember);
router.patch("/:circleId/members/:userId", enrichCircleRole, updateMemberRole);
router.post("/:circleId/members/me/read", updateLastReadAt);

export default router;
