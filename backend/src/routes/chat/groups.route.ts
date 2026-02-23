import { Router } from "express";

import {
  createChatGroup,
  deleteGroup,
  getGroupById,
  getUserGroups,
  updateGroup,
  joinGroup,
  getRecentActivityGroups,
  getGroupPreviewDetails,
} from "../../controllers/chat/index.js";
import { enrichChatRole } from "../../features/chat/security/middleware.js";

const router = Router();

router.post("/", createChatGroup);
router.get("/", getUserGroups);
router.get("/recent-activity", getRecentActivityGroups);
router.post("/join/:circleId", joinGroup);
router.get("/:circleId/preview", getGroupPreviewDetails);
router.get("/:circleId", enrichChatRole, getGroupById);
router.put("/:circleId", enrichChatRole, updateGroup);
router.delete("/:circleId", enrichChatRole, deleteGroup);

export default router;
