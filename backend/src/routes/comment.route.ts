import express from "express";

import {
  createComment,
  deleteComment,
  getReplies,
} from "../controllers/comment.controller";
import {
  writeOperationsLimiter,
  generalApiLimiter,
} from "../middleware/coreRateLimits";
import { requireAuth } from "../middleware/requireAuth";

const router = express.Router();

router.get("posts/:id/replies", generalApiLimiter, getReplies);
router.post(
  "/posts/:id/comments",
  writeOperationsLimiter,
  requireAuth,
  createComment
);
router.delete(
  "/comments/:id",
  writeOperationsLimiter,
  requireAuth,
  deleteComment
);

export default router;
