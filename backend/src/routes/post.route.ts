import express from "express";

import {
  createPost,
  deletePost,
  updatePost,
  getAllPosts,
  getPostById,
  getPostForEdit,
  getPostMetadata,
} from "../controllers/post.controller.js";
import {
  writeOperationsLimiter,
  generalApiLimiter,
} from "../middleware/coreRateLimits.middleware.js";
import attachLogContext from "../middleware/logContext.middleware.js";
import upload from "../middleware/multer.middleware.js";
import { requireAuth } from "../middleware/requireAuth.middleware.js";

const router = express.Router();

router.use(attachLogContext("PostController"));

/**
 * @openapi
 * /posts:
 *   get:
 *     summary: Get all posts
 *     description: Fetch all posts with pagination metadata
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paginated list of posts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PostsResponse'
 *       400:
 *         description: Bad request (e.g., Cursor is not a valid uuid)
 *       429:
 *         description: Too many requests (rate limit exceeded)
 *
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/CreatePostRequest'
 *     responses:
 *       201:
 *         description: Post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PostResponse'
 *       400:
 *         description: Bad request (e.g., Cursor is not a valid uuid, invalid request data)
 *       401:
 *         description: Unauthenticated
 *       429:
 *         description: Too many requests (rate limit exceeded)
 *       500:
 *         description: Unexpected error, post creation failed
 */
router.get("/posts", generalApiLimiter, getAllPosts);
router.post(
  "/posts",
  writeOperationsLimiter,
  requireAuth,
  upload.single("resource"),
  createPost
);

/**
 * @openapi
 * /posts/{id}:
 *   get:
 *     summary: Get a post by ID (with comments pagination)
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         description: The unique identifier of the post
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: limit
 *         description: Number of comments to return per page
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: cursor
 *         description: Cursor for pagination (ID of the last comment from previous page)
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Post details with comments
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PostWithComments'
 *       400:
 *         description: Bad request (e.g., Post ID is not a valid uuid)
 *       404:
 *         description: Post not found
 *       429:
 *         description: Too many requests (rate limit exceeded)
 */
router.get("/posts/:id", generalApiLimiter, getPostById);

/**
 * @openapi
 * /posts/{id}/edit:
 *   get:
 *     summary: Get post data for editing
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Post data for editing
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PostResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: User does not have permission to edit this post
 *       404:
 *         description: Post not found
 *       429:
 *         description: Too many requests (rate limit exceeded)
 */
router.get("/posts/:id/edit", generalApiLimiter, requireAuth, getPostForEdit);

/**
 * @openapi
 * /posts/{id}/metadata:
 *   get:
 *     summary: Get post metadata (admin only)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Post metadata
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PostMetadata'
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Post not found
 *       429:
 *         description: Too many requests (rate limit exceeded)
 */
router.get(
  "/posts/:id/metadata",
  generalApiLimiter,
  requireAuth,
  getPostMetadata
);

/**
 * @openapi
 * /posts/{id}:
 *   put:
 *     summary: Update a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePostRequest'
 *     responses:
 *       200:
 *         description: Post updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PostResponse'
 *       400:
 *         description: Invalid input data or update failed
 *       401:
 *         description: Unauthenticated
 *       403:
 *         description: User does not have permission to update this post
 *       404:
 *         description: Post not found
 *       429:
 *         description: Too many requests (rate limit exceeded)
 */
router.put("/posts/:id", writeOperationsLimiter, requireAuth, updatePost);

/**
 * @openapi
 * /posts/{id}:
 *   delete:
 *     summary: Delete a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *       400:
 *         description: Bad request (e.g., Post ID is not a valid uuid)
 *       401:
 *         description: Unauthenticated
 *       403:
 *         description: User does not have permission to delete this post
 *       404:
 *         description: Post not found
 *       429:
 *         description: Too many requests (rate limit exceeded)
 */
router.delete("/posts/:id", writeOperationsLimiter, requireAuth, deletePost);

export default router;
