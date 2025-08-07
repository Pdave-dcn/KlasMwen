import express from "express";

import {
  createPost,
  deletePost,
  updatePost,
  getAllPosts,
  getPostById,
  getPostForEdit,
  getPostMetadata,
} from "../controllers/post.controller.js";
import upload from "../middleware/multer.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();

router.get("/posts", getAllPosts);
router.get("/posts/:id", getPostById);
router.get("/posts/:id/edit", requireAuth, getPostForEdit);
router.get("/posts/:id/metadata", requireAuth, getPostMetadata);
router.post("/posts", requireAuth, upload.single("resource"), createPost);
router.put("/posts/:id", requireAuth, updatePost);
router.delete("/posts/:id", requireAuth, deletePost);

export default router;
