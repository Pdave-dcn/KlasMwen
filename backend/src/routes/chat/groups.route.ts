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
router.post("/join/:chatGroupId", joinGroup);
router.get("/:chatGroupId/preview", getGroupPreviewDetails);
router.get("/:chatGroupId", enrichChatRole, getGroupById);
router.put("/:chatGroupId", enrichChatRole, updateGroup);
router.delete("/:chatGroupId", enrichChatRole, deleteGroup);

export default router;
