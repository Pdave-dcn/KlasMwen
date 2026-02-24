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
} from "../../controllers/circle/index.js";
import { enrichChatRole } from "../../features/chat/security/middleware.js";

const router = Router();

router.post("/", createStudyCircle);
router.get("/", getUserCircles);
router.get("/recent-activity", getRecentActivityCircles);
router.post("/join/:circleId", joinCircle);
router.get("/:circleId/preview", getCirclePreviewDetails);
router.get("/:circleId", enrichChatRole, getCircleById);
router.put("/:circleId", enrichChatRole, updateCircle);
router.delete("/:circleId", enrichChatRole, deleteCircle);

export default router;
