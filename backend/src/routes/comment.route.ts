import express from "express";

import {
  createComment,
  deleteComment,
  getParentComments,
  getReplies,
} from "../controllers/comment.controller";
import {
  writeOperationsLimiter,
  generalApiLimiter,
} from "../middleware/coreRateLimits.middleware";
import attachLogContext from "../middleware/logContext.middleware";
import { requireAuth } from "../middleware/requireAuth.middleware";

const router = express.Router();

router.use(attachLogContext("commentController"));

/**
 * @openapi
 * /posts/{id}/comments:
 *   get:
 *     summary: Get parent comments for a specific post
 *     description: Fetch paginated parent comments for a given post ID.
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The id of the post
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of parent comments to return
 *       - in: query
 *         name: cursor
 *         required: false
 *         schema:
 *           type: integer
 *         description: ID of the last parent comment from the previous page (pagination)
 *     responses:
 *       200:
 *         description: A paginated list of parent comments
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ParentCommentsResponse"
 *       400:
 *         description: Invalid parent ID
 *       404:
 *         description: Parent comment not found
 *       429:
 *         description: Too many requests (rate limit exceeded)
 *       500:
 *         description: Internal server error
 */
router.get("/posts/:id/comments", generalApiLimiter, getParentComments);

/**
 * @openapi
 * /comments/{id}/replies:
 *   get:
 *     summary: Get replies for a parent comment
 *     description: Fetch paginated replies for a given parent comment ID.
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The id of the parent comment
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of replies to return
 *       - in: query
 *         name: cursor
 *         required: false
 *         schema:
 *           type: integer
 *         description: ID of the last reply from the previous page (pagination)
 *     responses:
 *       200:
 *         description: A paginated list of replies
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/CommentsResponse"
 *       400:
 *         description: Invalid parent ID
 *       404:
 *         description: Parent comment not found
 *       429:
 *         description: Too many requests (rate limit exceeded)
 *       500:
 *         description: Internal server error
 */
router.get("/comments/:id/replies", generalApiLimiter, getReplies);

/**
 * @openapi
 * /posts/{id}/comments:
 *   post:
 *     summary: Create a comment
 *     description: Creates a new comment under a post
 *     tags: [Comments]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The UUID of the post
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/CreateCommentRequest"
 *     responses:
 *       201:
 *         description: Comment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/CommentCreatedResponse"
 *       400:
 *         description: Bad request (e.g., parent comment does not belong to post)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Post or parent comment not found
 *       429:
 *         description: Too many requests (rate limit exceeded)
 *       500:
 *         description: Internal server error
 */
router.post(
  "/posts/:id/comments",
  writeOperationsLimiter,
  requireAuth,
  createComment
);

/**
 * @openapi
 * /comments/{id}:
 *   delete:
 *     summary: Delete a comment
 *     description: Deletes a comment by its ID. The authenticated user must have permission to delete it.
 *     tags: [Comments]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the comment to delete
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Comment deleted successfully"
 *       400:
 *         description: Invalid comment ID
 *       401:
 *         description: Unauthenticated
 *       403:
 *         description: User does not have permission to delete this comment
 *       404:
 *         description: Comment not found
 *       429:
 *         description: Too many requests (rate limit exceeded)
 *       500:
 *         description: Internal server error
 */
router.delete(
  "/comments/:id",
  writeOperationsLimiter,
  requireAuth,
  deleteComment
);

export default router;
