import express from "express";

import { searchPosts } from "../controllers/search.controller.js";
import { generalApiLimiter } from "../middleware/coreRateLimits.middleware.js";
import { requireAuth } from "../middleware/requireAuth.middleware.js";

const router = express.Router();

/**
 * @openapi
 * /search:
 *   get:
 *     summary: Search for posts
 *     description: Search for posts by title and content with cursor-based pagination
 *     tags: [Search]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: search
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *         description: Search term to match against post titles and content
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Maximum number of posts to return
 *       - name: cursor
 *         in: query
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Cursor for pagination
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SearchPostsResponse'
 *       400:
 *         description: Bad Request (invalid parameters or validation error)
 *       401:
 *         description: Unauthenticated
 *       429:
 *         description: Too Many Requests (rate limit exceeded)
 *       500:
 *         description: Internal Server Error
 */
router.get("/", generalApiLimiter, requireAuth, searchPosts);

export default router;
