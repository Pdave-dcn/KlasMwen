import express from "express";

import {
  createBookmark,
  deleteBookmark,
  getBookmarks,
} from "../controllers/bookmark.controller";
import {
  generalApiLimiter,
  writeOperationsLimiter,
} from "../middleware/coreRateLimits.middleware";
import attachLogContext from "../middleware/logContext.middleware";
import { requireAuth } from "../middleware/requireAuth.middleware";

const router = express.Router();

router.use(attachLogContext("BookmarkController"));

/**
 * @openapi
 * /users/bookmarks:
 *   get:
 *     summary: Get user bookmarks
 *     description: Retrieve a paginated list of bookmarked posts for the authenticated user
 *     tags: [Bookmarks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: limit
 *         in: query
 *         description: Number of bookmarked posts to return (1-50)
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *           example: 10
 *       - name: cursor
 *         in: query
 *         description: Cursor for pagination (post ID from previous response)
 *         required: false
 *         schema:
 *           type: string
 *           format: uuid
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Successfully retrieved bookmarks
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BookmarksResponse'
 *       400:
 *         description: Bad request (e.g., invalid query parameters)
 *       401:
 *         description: Unauthenticated
 *       429:
 *         description: Too many requests (rate limit exceeded)
 *       500:
 *         description: Internal server error
 */
router.get("/users/bookmarks", generalApiLimiter, requireAuth, getBookmarks);

/**
 * @openapi
 * /posts/{id}/bookmark:
 *   post:
 *     summary: Create a bookmark
 *     description: Bookmark a post for the authenticated user
 *     tags: [Bookmarks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: The ID of the post to bookmark
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       201:
 *         description: Bookmark created successfully
 *       400:
 *         description: Bad request (e.g., invalid post ID format)
 *       401:
 *         description: Unauthenticated
 *       404:
 *         description: Post not found
 *       409:
 *         description: Conflict - bookmark already exists
 *       429:
 *         description: Too many request (rate limit exceeded)
 *       500:
 *         description: Internal server error
 */
router.post(
  "/posts/:id/bookmark",
  writeOperationsLimiter,
  requireAuth,
  createBookmark
);

/**
 * @openapi
 * /users/{id}/bookmark:
 *   delete:
 *     summary: Remove a bookmark
 *     description: Remove a bookmark for the authenticated user
 *     tags: [Bookmarks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: The ID of the post to remove from bookmarks
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Bookmark removed successfully
 *       400:
 *         description: Bad request (e.g., invalid post ID format)
 *       401:
 *         description: Unauthenticated
 *       404:
 *         description: Bookmark not found
 *       429:
 *         description: Too many requests (rate limit exceeded)
 *       500:
 *         description: Internal server error
 */
router.delete(
  "/users/:id/bookmark",
  writeOperationsLimiter,
  requireAuth,
  deleteBookmark
);

export default router;
