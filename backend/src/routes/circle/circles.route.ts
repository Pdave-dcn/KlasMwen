import { Router } from "express";

import {
  createStudyCircle,
  deleteCircle,
  getCircleById,
  getUserCircles,
  updateCircle,
  joinCircle,
  getRecentActivityCircles,
  getCirclePreviewDetails,
  getCircleAvatars,
  leaveCircle,
} from "../../controllers/circle/index.js";
import { enrichCircleRole } from "../../features/circle/security/middleware.js";

const router = Router();

router.post("/", createStudyCircle);
router.get("/", getUserCircles);
router.get("/recent-activity", getRecentActivityCircles);
router.get("/avatars", getCircleAvatars);
router.post("/:circleId/join", joinCircle);
router.get("/:circleId/preview", getCirclePreviewDetails);
router.post("/:circleId/leave", enrichCircleRole, leaveCircle);
router.get("/:circleId", enrichCircleRole, getCircleById);
router.put("/:circleId", enrichCircleRole, updateCircle);
router.delete("/:circleId", enrichCircleRole, deleteCircle);

export default router;
