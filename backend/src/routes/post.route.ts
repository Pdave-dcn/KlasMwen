import express from "express";

import {
  createPost,
  deletePost,
  editPost,
  getAllPosts,
  getPostById,
} from "../controllers/post.controller";
import { requireAuth } from "../middleware/requireAuth";

const router = express.Router();

router.get("/posts", getAllPosts);
router.get("/posts/:id", getPostById);
router.post("/posts", requireAuth, createPost);
router.put("/posts/:id", requireAuth, editPost);
router.delete("/posts/:id", requireAuth, deletePost);

export default router;
