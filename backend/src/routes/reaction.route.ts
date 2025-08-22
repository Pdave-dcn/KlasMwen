import express from "express";

import { toggleLike } from "../controllers/reaction.controller.js";
import { reactionLimiter } from "../middleware/coreRateLimits.middleware.js";
import attachLogContext from "../middleware/logContext.middleware.js";
import { requireAuth } from "../middleware/requireAuth.middleware.js";

const router = express.Router();

router.use(attachLogContext("reactionController"));

/**
 * @openapi
 * /posts/{id}/like:
 *   post:
 *     summary: Toggle like on a post
 *     description: Likes or unlikes a post depending on the current state for the authenticated user.
 *     tags: [Reactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The UUID of the post to like or unlike
 *     responses:
 *       200:
 *         description: Post liked or unliked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Post liked successfully"
 *       401:
 *         description: User not authenticated
 *       404:
 *         description: The post being reacted to is not found
 *       429:
 *         description: Too many requests (rate limit exceeded)
 */
router.post("/posts/:id/like", reactionLimiter, requireAuth, toggleLike);

export default router;
