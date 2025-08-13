import express from "express";

import {
  createTag,
  deleteTag,
  getAllTags,
  getTagForEdit,
  updateTag,
} from "../controllers/tag.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();

router.get("/tags", getAllTags);
router.get("/tags/:id/edit", requireAuth, getTagForEdit);
router.post("/tags", requireAuth, createTag);
router.put("/tags/:id", requireAuth, updateTag);
router.delete("/tags/:id", requireAuth, deleteTag);

export default router;
