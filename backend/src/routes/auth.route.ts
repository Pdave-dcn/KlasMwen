import express from "express";

import { loginUser } from "../controllers/auth/login.controller.js";
import { registerUser } from "../controllers/auth/register.controller.js";
import { verifyAuth } from "../controllers/auth/verification.controller.js";
import { getClearCookieConfig } from "../core/config/cookie.js";
import {
  authLimiter,
  generalApiLimiter,
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
 *       409:
 *         description: Conflict - User already exists (Prisma error P2002)
 *         content:
 *           application/json:
 *             schema:
 *                $ref: "#/components/schemas/LoginAuthErrorResponse"
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
 *         description: Authentication failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Specific error message based on authentication failure type
 *                   enum:
 *                     - "Incorrect Password"
 *                     - "Invalid credentials"
 *                     - "User not found"
 *                   example: "Invalid credentials"
 *       429:
 *         description: Too many requests (rate limit exceeded)
 *       500:
 *         description: Internal server error
 */
router.post("/auth/login", authLimiter, loginUser);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Verify authentication and return user information
 *     description: |
 *       Verifies the user's authentication token from cookies and returns the authenticated user's information.
 *       Requires a valid JWT token to be present in the request cookies.
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Authentication verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "123e4567-e89b-12d3-a456-426614174000"
 *                 username:
 *                   type: string
 *                   example: "johndoe"
 *                 email:
 *                   type: string
 *                   example: "user@example.com"
 *                 role:
 *                   type: string
 *                   example: "STUDENT"
 *       401:
 *         description: Authentication failed
 *       429:
 *         description: Too many requests (rate limit exceeded)
 *       500:
 *         description: Server configuration error
 */
router.get("/auth/me", generalApiLimiter, verifyAuth);

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
  res.clearCookie("token", getClearCookieConfig());
  return res.status(200).json({ message: "Logout successful" });
});

export default router;
