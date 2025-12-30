import express from "express";

import {
  getMyPosts,
  getPostsLikedByMe,
  getUserComments,
  getUserMediaPosts,
  getUserPosts,
} from "../controllers/user/user.content.controller.js";
import {
  getActiveUser,
  getUserById,
  updateUserProfile,
} from "../controllers/user/user.profile.controller.js";
import {
  writeOperationsLimiter,
  generalApiLimiter,
} from "../middleware/coreRateLimits.middleware.js";
import attachLogContext from "../middleware/logContext.middleware.js";
import { requireAuth } from "../middleware/requireAuth.middleware.js";

const router = express.Router();

router.use(attachLogContext("userController"));
router.use(generalApiLimiter);
router.use(requireAuth);

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
router.get("/me", getActiveUser);

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
 *                 schema:
 *                   $ref: '#/components/schemas/UpdatedUserServerResponse'
 *       401:
 *         description: User not authenticated
 *       404:
 *         description: User not found
 *       429:
 *         description: Too many requests (rate limit exceeded)
 *       500:
 *         description: Internal server error
 */
router.put("/me", writeOperationsLimiter, updateUserProfile);

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
 *                     $ref: '#/components/schemas/PostsResponse'
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
router.get("/me/posts", getMyPosts);

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
 *                     $ref: '#/components/schemas/PostsResponse'
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
  "/me/posts/like",

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
router.get("/:id", getUserById);

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
router.get("/:id/posts", getUserPosts);

/**
 * @openapi
 * /users/{id}/posts/media:
 *   get:
 *     summary: Get user's media posts
 *     description: Retrieves paginated media posts (posts without text content) created by a specific user
 *     tags: [Posts, Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier of the user
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Maximum number of posts to return
 *       - in: query
 *         name: cursor
 *         required: false
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Cursor for pagination (post ID to start after)
 *     responses:
 *       200:
 *         description: Successfully retrieved user's media posts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PostsResponse'
 *                   description: Array of media posts
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     hasMore:
 *                       type: boolean
 *                       description: Whether there are more posts available
 *                     nextCursor:
 *                       type: string
 *                       format: uuid
 *                       description: Cursor for the next page (if hasMore is true)
 *                       nullable: true
 *       404:
 *         description: User not found
 *       400:
 *         description: Invalid request parameters
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
router.get("/:id/posts/media", getUserMediaPosts);

/**
 * @openapi
 * /users/{id}/comments:
 *   get:
 *     tags: [Users, Comments]
 *     summary: Get user's comments and replies
 *     description: Retrieves a paginated list of all comments and replies made by a specific user, including related post and parent comment information.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The unique identifier of the user
 *         schema:
 *           type: string
 *           format: uuid
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *       - name: limit
 *         in: query
 *         required: false
 *         description: Number of comments to return per page (default 10, max 50)
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         example: 20
 *       - name: cursor
 *         in: query
 *         required: false
 *         description: Cursor for pagination to get the next set of results
 *         schema:
 *           type: number
 *         example: 12
 *     responses:
 *       200:
 *         description: Successfully retrieved user comments and replies
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserCommentsResponse'
 *       404:
 *         description: User not found
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
router.get("/:id/comments", getUserComments);

export default router;
