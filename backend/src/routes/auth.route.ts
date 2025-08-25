import express from "express";

import { loginUser } from "../controllers/auth/login.controller.js";
import { registerUser } from "../controllers/auth/register.controller.js";
import {
  authLimiter,
  registerLimiter,
} from "../middleware/coreRateLimits.middleware.js";
import attachLogContext from "../middleware/logContext.middleware.js";

const router = express.Router();

router.use(attachLogContext("AuthController"));

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a new user and set authentication cookie
 *     description: >
 *       Creates a new user account with email and password.
 *       On success, the server sets an `httpOnly` authentication cookie containing the JWT, so the user is automatically logged in.
 *       The JWT is not returned in the response body.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: "newUser"
 *               email:
 *                 type: string
 *                 example: "newuser@example.com"
 *               password:
 *                 type: string
 *                 example: "myPassword123"
 *     responses:
 *       201:
 *         description: User registered successfully, authentication cookie set
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User registered successfully"
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "123e4567-e89b-12d3-a456-426614174000"
 *                     username:
 *                       type: string
 *                       example: "newuser"
 *                     email:
 *                       type: string
 *                       example: "newuser@example.com"
 *                     role:
 *                       type: string
 *                       example: "STUDENT"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-08-25T14:48:00.000Z"
 *       400:
 *         description: Invalid input data
 *       429:
 *         description: Too many requests (rate limit exceeded)
 *       500:
 *         description: Internal server error
 */
router.post("/auth/register", registerLimiter, registerUser);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Authenticate a user and return a token
 *     description: |
 *       Logs a user in using email and password.
 *       On success, the server sets an `httpOnly` authentication cookie containing the JWT.
 *       The cookie is used automatically by the browser for subsequent requests, and the token is not returned in the response body.
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
 *         description: Login successful, authentication cookie set
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Login successful"
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "123e4567-e89b-12d3-a456-426614174000"
 *                     username:
 *                       type: string
 *                       example: "johndoe"
 *                     email:
 *                       type: string
 *                       example: "user@example.com"
 *                     role:
 *                       type: string
 *                       example: "STUDENT"
 *       401:
 *         description: Invalid credentials
 *       429:
 *         description: Too many requests (rate limit exceeded)
 *       500:
 *         description: Internal server error
 */
router.post("/auth/login", authLimiter, loginUser);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Logout the current user
 *     description: Clears the authentication cookie to log the user out.
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Logout successful"
 */
router.post("/auth/logout", (_req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  return res.status(200).json({ message: "Logout successful" });
});

export default router;
