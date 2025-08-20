import express from "express";

import {
  createTag,
  deleteTag,
  getAllTags,
  getTagForEdit,
  updateTag,
} from "../controllers/tag.controller.js";
import {
  generalApiLimiter,
  writeOperationsLimiter,
} from "../middleware/coreRateLimits.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();

/**
 * @openapi
 * /tags:
 *   get:
 *     summary: Get all tags
 *     description: Retrieves a paginated list of all tags.
 *     tags: [Tags]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: integer
 *           nullable: true
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *     responses:
 *       200:
 *         description: Tags retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: "#/components/schemas/TagsResponse"
 *       400:
 *           description: Bad request (e.g., Invalid cursor format)
 *       429:
 *         description: Too many requests (rate limit exceeded)
 *
 *   post:
 *     summary: Create a new tag (admin only)
 *     description: Creates a new tag. Requires authentication.
 *     tags: [Tags]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "programming"
 *             required:
 *               - name
 *     responses:
 *       201:
 *         description: Tag created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/TagResponse"
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       429:
 *         description: Too many requests (rate limit exceeded)
 *
 * /tags/{id}/edit:
 *   get:
 *     summary: Get a tag for editing (admin only)
 *     description: Fetches a single tag by ID for editing. Requires authentication.
 *     tags: [Tags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Tag retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: "#/components/schemas/Tag"
 *       400:
 *         description: Bad Request (e.g., Tag id not a number)
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Tag not found
 *       429:
 *         description: Too many requests (rate limit exceeded)
 *
 * /tags/{id}:
 *   put:
 *     summary: Update a tag (admin only)
 *     description: Updates a tag's name. Requires authentication.
 *     tags: [Tags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "new tag name"
 *             required:
 *               - name
 *     responses:
 *       200:
 *         description: Tag updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/TagResponse"
 *       400:
 *         description: Bad Request (e.g., Tag id not a number)
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Tag not found
 *       429:
 *         description: Too many requests (rate limit exceeded)
 *
 *   delete:
 *     summary: Delete a tag (admin only)
 *     description: Deletes a tag by ID. Requires authentication.
 *     tags: [Tags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Tag deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Tag deleted successfully"
 *       400:
 *         description: Bad Request (e.g., Tag id not a number)
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Tag not found
 *       429:
 *         description: Too many requests (rate limit exceeded)
 */
router.get("/tags", generalApiLimiter, getAllTags);
router.get("/tags/:id/edit", generalApiLimiter, requireAuth, getTagForEdit);
router.post("/tags", writeOperationsLimiter, requireAuth, createTag);
router.put("/tags/:id", writeOperationsLimiter, requireAuth, updateTag);
router.delete("/tags/:id", writeOperationsLimiter, requireAuth, deleteTag);

export default router;
