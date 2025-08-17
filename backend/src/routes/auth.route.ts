import express from "express";

import { loginUser } from "../controllers/auth/login.controller.js";
import { registerUser } from "../controllers/auth/register.controller.js";
import { authLimiter, registerLimiter } from "../middleware/coreRateLimits.js";

const router = express.Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account with email and password.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: "newuser@example.com"
 *               password:
 *                 type: string
 *                 example: "myPassword123"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User registered successfully"
 *       400:
 *         description: Invalid input data
 *       429:
 *         description: Too many requests (rate limit exceeded)
 */
router.post("/auth/register", registerLimiter, registerUser);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Authenticate a user and return a token
 *     description: Logs a user in using email and password and returns a JWT or session token.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 example: "myPassword123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       401:
 *         description: Invalid credentials
 *       429:
 *         description: Too many requests (rate limit exceeded)
 */
router.post("/auth/login", authLimiter, loginUser);

export default router;
