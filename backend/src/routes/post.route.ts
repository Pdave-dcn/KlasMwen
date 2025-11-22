import express from "express";

import { createPost } from "../controllers/post/post.create.controller.js";
import { deletePost } from "../controllers/post/post.delete.controller.js";
import {
  downloadResource,
  getAllPosts,
  getPostById,
  getPostForEdit,
} from "../controllers/post/post.fetch.controller.js";
import { updatePost } from "../controllers/post/post.update.controller.js";
import {
  writeOperationsLimiter,
  generalApiLimiter,
  downloadLimiter,
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
 *     security:
 *       - cookieAuth: []
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
 *       401:
 *         description: Unauthenticated
 *       429:
 *         description: Too many requests (rate limit exceeded)
 *       500:
 *         description: Internal server error
 *
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
 *     security:
 *       - cookieAuth: []
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
router.get("/posts", generalApiLimiter, requireAuth, getAllPosts);
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
 *     summary: Get a post by ID
 *     tags: [Posts]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         description: The unique identifier of the post
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Post details with comments
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SinglePostResponse'
 *       400:
 *         description: Bad request (e.g., Post ID is not a valid uuid)
 *       401:
 *         description: Unauthenticated
 *       404:
 *         description: Post not found
 *       429:
 *         description: Too many requests (rate limit exceeded)
 *       500:
 *         description: Internal server error
 */
router.get("/posts/:id", generalApiLimiter, requireAuth, getPostById);

/**
 * @openapi
 * /posts/{id}/edit:
 *   get:
 *     summary: Get post data for editing
 *     tags: [Posts]
 *     security:
 *       - cookieAuth: []
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
 *       500:
 *         description: Internal server error
 */
router.get("/posts/:id/edit", generalApiLimiter, requireAuth, getPostForEdit);

/**
 * @openapi
 * /posts/{id}/download:
 *   get:
 *     summary: Download a post resource file
 *     description: Streams a file attachment from a post. The file is streamed directly from Cloudinary to the client.
 *     tags: [Posts]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the post containing the resource to download
 *     responses:
 *       200:
 *         description: File stream
 *         headers:
 *           Content-Disposition:
 *             schema:
 *               type: string
 *             description: Attachment with filename
 *             example: 'attachment; filename="document.pdf"'
 *           Content-Type:
 *             schema:
 *               type: string
 *             description: MIME type of the file
 *             example: application/pdf
 *           Content-Length:
 *             schema:
 *               type: integer
 *             description: Size of the file in bytes
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Resource not found or post has no file attachment
 *       429:
 *         description: Too many requests (rate limit exceeded)
 *       500:
 *         description: Internal server error or error streaming file
 */
router.get(
  "/posts/:id/download",
  downloadLimiter,
  requireAuth,
  downloadResource
);

/**
 * @openapi
 * /posts/{id}:
 *   put:
 *     summary: Update a post
 *     tags: [Posts]
 *     security:
 *       - cookieAuth: []
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
 *       500:
 *         description: Internal server error
 */
router.put("/posts/:id", writeOperationsLimiter, requireAuth, updatePost);

/**
 * @openapi
 * /posts/{id}:
 *   delete:
 *     summary: Delete a post
 *     tags: [Posts]
 *     security:
 *       - cookieAuth: []
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
 *       500:
 *         description: Internal server error
 */
router.delete("/posts/:id", writeOperationsLimiter, requireAuth, deletePost);

export default router;
