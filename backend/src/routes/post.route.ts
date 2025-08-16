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
import {
  writeOperationsLimiter,
  generalApiLimiter,
} from "../middleware/coreRateLimits.js";
import upload from "../middleware/multer.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();

router.get("/posts", generalApiLimiter, getAllPosts);
router.get("/posts/:id", generalApiLimiter, getPostById);
router.get("/posts/:id/edit", generalApiLimiter, requireAuth, getPostForEdit);
router.get(
  "/posts/:id/metadata",
  generalApiLimiter,
  requireAuth,
  getPostMetadata
);
router.post(
  "/posts",
  writeOperationsLimiter,
  requireAuth,
  upload.single("resource"),
  createPost
);
router.put("/posts/:id", writeOperationsLimiter, requireAuth, updatePost);
router.delete("/posts/:id", writeOperationsLimiter, requireAuth, deletePost);

export default router;
