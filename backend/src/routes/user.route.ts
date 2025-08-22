import express from "express";

import {
  getMyPosts,
  getUserById,
  updateUserProfile,
} from "../controllers/user.controller";
import {
  writeOperationsLimiter,
  generalApiLimiter,
} from "../middleware/coreRateLimits.middleware";
import attachLogContext from "../middleware/logContext.middleware";
import { requireAuth } from "../middleware/requireAuth.middleware";

const router = express.Router();

router.use(attachLogContext("userController"));

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     description: Retrieves user details by their ID.
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The UUID of the user to retrieve
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       429:
 *         description: Too many requests (rate limit exceeded)
 */
router.get("/users/:id", generalApiLimiter, getUserById);

/**
 * @openapi
 * /users/me:
 *   put:
 *     summary: Update authenticated user's profile
 *     description: Updates the bio and avatar of the currently authenticated user.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserProfileRequest'
 *     responses:
 *       200:
 *         description: User profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Profile updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: User not authenticated
 *       404:
 *         description: User not found
 *       429:
 *         description: Too many requests (rate limit exceeded)
 */
router.put("/users/me", writeOperationsLimiter, requireAuth, updateUserProfile);

/**
 * @openapi
 * /users/me/posts:
 *   get:
 *     summary: Get posts created by authenticated user
 *     description: Retrieves a paginated list of posts authored by the currently authenticated user.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of posts to return
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: ID of the post to start pagination from (cursor-based)
 *     responses:
 *       200:
 *         description: List of posts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Post'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     nextCursor:
 *                       type: string
 *                       nullable: true
 *                       example: "a1b2c3d4-uuid"
 *                     hasMore:
 *                       type: boolean
 *                       example: true
 *                     totalPosts:
 *                       type: integer
 *                       example: 25
 *       401:
 *         description: User not authenticated
 *       429:
 *         description: Too many requests (rate limit exceeded)
 */
router.get("/users/me/posts", generalApiLimiter, requireAuth, getMyPosts);

export default router;
