import express from "express";

import {
  getActiveUser,
  getMyPosts,
  getPostsLikedByMe,
  getUserById,
  getUserComments,
  getUserPosts,
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
 * /users/me:
 *   get:
 *     summary: Get authenticated user profile
 *     description: Retrieves the profile information of the currently authenticated user
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       description: User's unique identifier
 *                       example: "123e4567-e89b-12d3-a456-426614174000"
 *                     username:
 *                       type: string
 *                       description: User's username
 *                       example: "johndoe"
 *                     bio:
 *                       type: string
 *                       nullable: true
 *                       description: User's biography
 *                       example: "Software developer passionate about open source"
 *                     Avatar:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                           description: Avatar's unique identifier
 *                         url:
 *                           type: string
 *                           format: uri
 *                           description: Avatar image URL
 *                           example: "https://example.com/avatars/user123.jpg"
 *                     role:
 *                       type: string
 *                       description: User's role in the system
 *                       example: "USER"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       description: Account creation timestamp
 *                       example: "2024-01-15T10:30:00.000Z"
 *       401:
 *         description: Authentication required
 *       404:
 *         description: User not found
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
router.get("/users/me", generalApiLimiter, requireAuth, getActiveUser);

/**
 * @openapi
 * /users/me:
 *   put:
 *     summary: Update authenticated user's profile
 *     description: Updates the bio and avatar of the currently authenticated user.
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
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
 *       500:
 *         description: Internal server error
 */
router.put("/users/me", writeOperationsLimiter, requireAuth, updateUserProfile);

/**
 * @openapi
 * /users/me/posts:
 *   get:
 *     summary: Get posts created by authenticated user
 *     description: Retrieves a paginated list of posts authored by the currently authenticated user.
 *     tags: [Users, Posts]
 *     security:
 *       - cookieAuth: []
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
 *       500:
 *         description: Internal server error
 */
router.get("/users/me/posts", generalApiLimiter, requireAuth, getMyPosts);

/**
 * @openapi
 * /users/me/posts/like:
 *   get:
 *     summary: Get posts liked by authenticated user
 *     description: Retrieves a paginated list of posts that the currently authenticated user has liked.
 *     tags: [Users, Posts]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         required: false
 *         description: Maximum number of posts to return (pagination)
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         example: 20
 *       - in: query
 *         name: cursor
 *         required: false
 *         description: Cursor for pagination (UUID of the last post from previous page)
 *         schema:
 *           type: string
 *           format: uuid
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Liked posts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Post'
 *                   description: Array of posts liked by the user
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     hasMore:
 *                       type: boolean
 *                       description: Whether there are more posts available
 *                       example: true
 *                     nextCursor:
 *                       type: string
 *                       format: uuid
 *                       nullable: true
 *                       description: Cursor for the next page of results
 *                       example: "456e7890-e89b-12d3-a456-426614174001"
 *             example:
 *               data:
 *                 - id: "123e4567-e89b-12d3-a456-426614174000"
 *                   title: "Introduction to TypeScript"
 *                   content: "TypeScript is a powerful superset of JavaScript..."
 *                   type: "TEXT"
 *                   fileUrl: null
 *                   fileName: null
 *                   createdAt: "2024-01-15T10:30:00.000Z"
 *                   author:
 *                     id: "789e0123-e89b-12d3-a456-426614174002"
 *                     username: "developer123"
 *                     Avatar:
 *                       id: "abc4567-e89b-12d3-a456-426614174003"
 *                       url: "https://example.com/avatars/dev123.jpg"
 *                   tags: ["typescript", "programming"]
 *                   counts:
 *                     comments: 5
 *                     likes: 12
 *               pagination:
 *                 hasMore: true
 *                 nextCursor: "456e7890-e89b-12d3-a456-426614174001"
 *       401:
 *         description: User not authenticated
 *       400:
 *         description: Invalid request parameters
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
router.get(
  "/users/me/posts/like",
  generalApiLimiter,
  requireAuth,
  getPostsLikedByMe
);

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
 *       500:
 *         description: Internal server error
 */
router.get("/users/:id", generalApiLimiter, getUserById);

/**
 * @openapi
 * /users/{id}/posts:
 *   get:
 *     summary: Get posts by user ID
 *     description: Retrieves a paginated list of posts created by a specific user
 *     tags: [Users, Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The unique identifier of the user
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: limit
 *         required: false
 *         description: Maximum number of posts to return (pagination)
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *       - in: query
 *         name: cursor
 *         required: false
 *         description: Cursor for pagination (UUID of the last post from previous page)
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       '200':
 *         description: Posts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PostsResponse'
 *       404:
 *         description: User not found
 *       400:
 *         description: Invalid request parameters
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
router.get("/users/:id/posts", generalApiLimiter, getUserPosts);

// todo: write openApi docs for this endpoint
router.get("/users/:id/comments", generalApiLimiter, getUserComments);

export default router;
