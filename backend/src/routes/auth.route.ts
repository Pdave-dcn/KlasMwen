import express from "express";

import { loginUser } from "../controllers/auth/login.controller.js";
import { registerUser } from "../controllers/auth/register.controller.js";
import { authLimiter, registerLimiter } from "../middleware/coreRateLimits.js";

const router = express.Router();

router.post("/auth/register", registerLimiter, registerUser);
router.post("/auth/login", authLimiter, loginUser);

export default router;
