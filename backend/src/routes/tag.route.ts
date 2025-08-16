import express from "express";

import {
  createTag,
  deleteTag,
  getAllTags,
  getTagForEdit,
  updateTag,
} from "../controllers/tag.controller.js";
import {
  generalApiLimiter,
  writeOperationsLimiter,
} from "../middleware/coreRateLimits.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();

router.get("/tags", generalApiLimiter, getAllTags);
router.get("/tags/:id/edit", generalApiLimiter, requireAuth, getTagForEdit);
router.post("/tags", writeOperationsLimiter, requireAuth, createTag);
router.put("/tags/:id", writeOperationsLimiter, requireAuth, updateTag);
router.delete("/tags/:id", writeOperationsLimiter, requireAuth, deleteTag);

export default router;
