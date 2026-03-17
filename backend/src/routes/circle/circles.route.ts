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
} from "../../controllers/circle/index.js";
import { enrichCircleRole } from "../../features/circle/security/middleware.js";

const router = Router();

router.post("/", createStudyCircle);
router.get("/", getUserCircles);
router.get("/recent-activity", getRecentActivityCircles);
router.get("/avatars", getCircleAvatars);
router.post("/join/:circleId", joinCircle);
router.get("/:circleId/preview", getCirclePreviewDetails);
router.get("/:circleId", enrichCircleRole, getCircleById);
router.put("/:circleId", enrichCircleRole, updateCircle);
router.delete("/:circleId", enrichCircleRole, deleteCircle);

export default router;
