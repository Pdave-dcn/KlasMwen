import express from "express";

import { toggleLike } from "../controllers/reaction.controller.js";
import { reactionLimiter } from "../middleware/coreRateLimits.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();

router.post("/posts/:id/like", reactionLimiter, requireAuth, toggleLike);

export default router;
