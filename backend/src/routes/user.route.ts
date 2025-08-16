import express from "express";

import {
  getMyPosts,
  getUserById,
  updateUserProfile,
} from "../controllers/user.controller";
import {
  writeOperationsLimiter,
  generalApiLimiter,
} from "../middleware/coreRateLimits";
import { requireAuth } from "../middleware/requireAuth";

const router = express.Router();

router.get("/users/:id", generalApiLimiter, getUserById);
router.put("/users/me", writeOperationsLimiter, requireAuth, updateUserProfile);
router.get("/users/me/posts", generalApiLimiter, requireAuth, getMyPosts);

export default router;
