import express, { type RequestHandler } from "express";

import { loginUser } from "../controllers/auth/login.controller.js";
import { registerUser } from "../controllers/auth/register.controller.js";

const router = express.Router();

router.post("/auth/register", registerUser as RequestHandler);
router.post("/auth/login", loginUser as RequestHandler);

export default router;
