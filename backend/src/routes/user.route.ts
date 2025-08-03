import express from "express";

import {
  getMyPosts,
  getUserById,
  updateUserProfile,
} from "../controllers/user.controller";
import { requireAuth } from "../middleware/requireAuth";

const router = express.Router();

router.get("users/:id", getUserById);
router.put("users/me", requireAuth, updateUserProfile);
router.get("users/me/posts", requireAuth, getMyPosts);

export default router;
