import express from "express";

import { searchPosts } from "../controllers/search.controller";
import { generalApiLimiter } from "../middleware/coreRateLimits";

const route = express.Router();

/**
 * @openapi
 * /search/posts:
 *   get:
 *     summary: Search for posts
 *     description: Search for posts by title and content with cursor-based pagination
 *     tags: [Search]
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
 *       429:
 *         description: Too Many Requests (rate limit exceeded)
 *       500:
 *         description: Internal Server Error
 */
route.get("/search/posts", generalApiLimiter, searchPosts);

export default route;
