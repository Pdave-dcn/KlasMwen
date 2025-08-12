import express from "express";

import {
  createComment,
  deleteComment,
  getReplies,
} from "../controllers/comment.controller";
import { requireAuth } from "../middleware/requireAuth";

const router = express.Router();

router.get("posts/:id/replies", getReplies);
router.post("/posts/:id/comments", requireAuth, createComment);
router.delete("/comments/:id", requireAuth, deleteComment);

export default router;
