import express from "express";

import {
  createTag,
  deleteTag,
  getAllTags,
  getPopularTags,
  getTagForEdit,
  updateTag,
} from "../controllers/tag.controller.js";
import {
  generalApiLimiter,
  writeOperationsLimiter,
} from "../middleware/coreRateLimits.middleware.js";
import attachLogContext from "../middleware/logContext.middleware.js";
import { requireAuth } from "../middleware/requireAuth.middleware.js";
import { requireRole } from "../middleware/requireRole.middleware.js";

const router = express.Router();

router.use(attachLogContext("TagController"));
router.use(generalApiLimiter);
router.use(requireAuth);

/**
 * @openapi
 * /tags:
 *   get:
 *     summary: Get all tags
 *     description: Retrieves a list of all tags.
 *     tags: [Tags]
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
 *       500:
 *         description: Internal server error
 *
 *   post:
 *     summary: Create a new tag (admin only)
 *     description: Creates a new tag. Requires authentication.
 *     tags: [Tags]
 *     security:
 *       - cookieAuth: []
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
 *       409:
 *         description: Conflict - Tag already exists (Prisma error P2002)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unique constraint failed on the field(s): name"
 *                 fields:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["name"]
 *       403:
 *         description: Admin access required
 *       429:
 *         description: Too many requests (rate limit exceeded)
 *       500:
 *         description: Internal server error
 *
 * /tags/popular:
 *   get:
 *     summary: Get top ten most popular tags
 *     description: Retrieves a list of 10 most used tags.
 *     tags: [Tags]
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
 *                     $ref: "#/components/schemas/PopularTagsResponse"
 *       400:
 *           description: Bad request (e.g., Invalid cursor format)
 *       429:
 *         description: Too many requests (rate limit exceeded)
 *       500:
 *         description: Internal server error
 *
 * /tags/{id}/edit:
 *   get:
 *     summary: Get a tag for editing (admin only)
 *     description: Fetches a single tag by ID for editing. Requires authentication.
 *     tags: [Tags]
 *     security:
 *       - cookieAuth: []
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
 *       500:
 *         description: Internal server error
 *
 * /tags/{id}:
 *   put:
 *     summary: Update a tag (admin only)
 *     description: Updates a tag's name. Requires authentication.
 *     tags: [Tags]
 *     security:
 *       - cookieAuth: []
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
 *       409:
 *         description: Conflict - Tag already exists (Prisma error P2002)
 *       429:
 *         description: Too many requests (rate limit exceeded)
 *       500:
 *         description: Internal server error
 *
 *   delete:
 *     summary: Delete a tag (admin only)
 *     description: Deletes a tag by ID. Requires authentication.
 *     tags: [Tags]
 *     security:
 *       - cookieAuth: []
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
 *       500:
 *         description: Internal server error
 */
router.get("/", getAllTags);
router.get("/popular", getPopularTags);

router.use(requireRole("ADMIN"));

router.get("/:id/edit", getTagForEdit);

router.use(writeOperationsLimiter);

router.post("/", createTag);
router.put("/:id", updateTag);
router.delete("/:id", deleteTag);

export default router;
