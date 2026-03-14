import { Router } from "express";

import {
  addMember,
  getCircleMembers,
  removeMember,
  updateMemberRole,
  updateLastReadAt,
  setMemberMute,
} from "../../controllers/circle/index.js";
import {
  enrichCircleRole,
  requireMembership,
} from "../../features/circle/security/middleware.js";

const router = Router();

router.post("/:circleId/members", enrichCircleRole, addMember);
router.get("/:circleId/members", requireMembership, getCircleMembers);
router.delete("/:circleId/members/:userId", enrichCircleRole, removeMember);
router.patch("/:circleId/members/:userId", enrichCircleRole, updateMemberRole);
router.patch(
  "/:circleId/members/:userId/mute",
  enrichCircleRole,
  setMemberMute,
);
router.post("/:circleId/members/me/read", updateLastReadAt);

export default router;
