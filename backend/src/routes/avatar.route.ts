import express from "express";

import {
  addAvatar,
  deleteAvatar,
  getAvailableAvatars,
  getAvatars,
} from "../controllers/avatar.controller.js";
import {
  generalApiLimiter,
  writeOperationsLimiter,
} from "../middleware/coreRateLimits.middleware.js";
import attachLogContext from "../middleware/logContext.middleware.js";
import { requireAuth } from "../middleware/requireAuth.middleware.js";

const router = express.Router();

router.use(attachLogContext("avatarController"));

/**
 * @openapi
 * /avatars/available:
 *   get:
 *     tags: [Avatars]
 *     summary: Get available avatars
 *     description: |
 *       Retrieves a paginated list of available avatars for users to choose from.
 *       Only returns non-default avatars (isDefault: false).
 *       This endpoint does not require authentication.
 *     parameters:
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/CursorParam'
 *     responses:
 *       '200':
 *         description: Successfully retrieved available avatars
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedAvatarsResponse'
 *             example:
 *               data:
 *                 - id: 1
 *                   url: "https://cdn.example.com/avatars/avatar1.png"
 *                   isDefault: false
 *                 - id: 2
 *                   url: "https://cdn.example.com/avatars/avatar2.png"
 *                   isDefault: false
 *               pagination:
 *                 hasMore: true
 *                 nextCursor: 2
 *       '400':
 *         description: Bad requests
 *       '429':
 *         description: Too many requests (rate limit exceeded)
 *       '500':
 *         description: Internal server error
 */
router.get("/avatars/available", generalApiLimiter, getAvailableAvatars);

/**
 * @openapi
 * /avatars:
 *   get:
 *     tags: [Avatars]
 *     summary: Get all avatars (Admin only)
 *     description: |
 *       Retrieves a paginated list of all avatars in the system, including both
 *       default and non-default avatars. Requires admin authentication.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/CursorParam'
 *     responses:
 *       '200':
 *         description: Successfully retrieved all avatars
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedAvatarsResponse'
 *             example:
 *               data:
 *                 - id: 1
 *                   url: "https://cdn.example.com/avatars/avatar1.png"
 *                   isDefault: false
 *                 - id: 2
 *                   url: "https://cdn.example.com/avatars/default-avatar.png"
 *                   isDefault: true
 *               pagination:
 *                 hasMore: false
 *                 nextCursor: null
 *       '400':
 *         description: Bad request
 *       '401':
 *         description: Unauthorized
 *       '429':
 *         description: Too many requests (rate limit exceeded)
 *       '500':
 *         description: Internal server error
 *
 *   post:
 *     tags:
 *       - Avatars
 *     summary: Add avatar(s) (Admin only)
 *     description: |
 *       Creates one or multiple new avatars in the system.
 *       Accepts either a single avatar object or an array of avatar objects.
 *       Requires admin authentication.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - $ref: '#/components/schemas/CreateAvatarRequest'
 *               - type: array
 *                 items:
 *                   $ref: '#/components/schemas/CreateAvatarRequest'
 *                 minItems: 1
 *           examples:
 *             single_avatar:
 *               summary: Single avatar
 *               value:
 *                 url: "https://cdn.example.com/avatars/new-avatar.png"
 *                 isDefault: false
 *             single_default_avatar:
 *               summary: Single default avatar
 *               value:
 *                 url: "https://cdn.example.com/avatars/default-avatar.png"
 *                 isDefault: true
 *             multiple_avatars:
 *               summary: Multiple avatars
 *               value:
 *                 - url: "https://cdn.example.com/avatars/avatar1.png"
 *                   isDefault: false
 *                 - url: "https://cdn.example.com/avatars/avatar2.png"
 *                   isDefault: true
 *                 - url: "https://cdn.example.com/avatars/avatar3.png"
 *     responses:
 *       '201':
 *         description: Avatar(s) created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AvatarCreateResponse'
 *             examples:
 *               single_avatar_response:
 *                 summary: Single avatar created
 *                 value:
 *                   message: "Avatar(s) added successfully"
 *                   data:
 *                     id: 10
 *                     url: "https://cdn.example.com/avatars/new-avatar.png"
 *                     isDefault: false
 *               multiple_avatars_response:
 *                 summary: Multiple avatars created
 *                 value:
 *                   message: "Avatar(s) added successfully"
 *                   data:
 *                    count: 3
 *
 *       '400':
 *         description: Bad request
 *       '401':
 *         description: Unauthorized
 *       '429':
 *         description: Too many requests (rate limit exceeded)
 *       '500':
 *         description: Internal server error
 */
router.get("/avatars", generalApiLimiter, requireAuth, getAvatars);
router.post("/avatars", writeOperationsLimiter, requireAuth, addAvatar);

/**
 * @openapi
 * /avatars/{id}:
 *   delete:
 *     tags: [Avatars]
 *     summary: Delete avatar (Admin only)
 *     description: |
 *       Deletes a specific avatar from the system by its ID.
 *       The avatar must exist in the system to be deleted.
 *       Requires admin authentication.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/AvatarIdParam'
 *     responses:
 *       '200':
 *         description: Avatar deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AvatarDeleteResponse'
 *
 *       '400':
 *         description: Bad request
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Avatar not found
 *       '429':
 *         description: Too many requests (rate limit exceeded)
 *       '500':
 *         description: Internal server error
 */
router.delete(
  "/avatars/:id",
  writeOperationsLimiter,
  requireAuth,
  deleteAvatar
);

export default router;
