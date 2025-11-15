import express from "express";

import {
  createReport,
  deleteReport,
  getAllReports,
  getReportById,
  getReportReasons,
  getReportStats,
  toggleVisibility,
  updateReportStatus,
} from "../controllers/report.controller.js";
import {
  generalApiLimiter,
  reportCreationLimiter,
  reportModerationLimiter,
} from "../middleware/coreRateLimits.middleware.js";
import attachLogContext from "../middleware/logContext.middleware.js";
import { requireAuth } from "../middleware/requireAuth.middleware.js";

const router = express.Router();

router.use(attachLogContext("ReportController"));

/**
 * @openapi
 * /reports/reasons:
 *   get:
 *     tags: [Reports]
 *     summary: Get available report reasons
 *     description: |
 *       Retrieves a list of available report reasons for users to choose from.
 *       Only returns active reports (active: true).
 *       This endpoint does not require authentication.
 *     responses:
 *       '200':
 *         description: Successfully retrieved available report reasons
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ActiveReasonsResponse'
 *       '400':
 *         description: Bad requests
 *       '429':
 *         description: Too many requests (rate limit exceeded)
 *       '500':
 *         description: Internal server error
 */
router.get("/reports/reasons", generalApiLimiter, getReportReasons);

// todo: write OpenApi specs
router.get("/reports/stats", generalApiLimiter, requireAuth, getReportStats);

/**
 * @openapi
 * /reports:
 *   get:
 *     tags: [Reports]
 *     summary: Get all reports (Admin/Moderator only)
 *     description: |
 *       Retrieves a paginated and optionally filtered list of all reports in the system.
 *       Results are ordered by creation date (most recent first).
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, REVIEWED, DISMISSED]
 *         description: Filter reports by status
 *         required: false
 *       - in: query
 *         name: postId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter reports by post ID
 *         required: false
 *       - in: query
 *         name: commentId
 *         schema:
 *           type: integer
 *         description: Filter reports by comment ID
 *         required: false
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *         required: false
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of reports per page (max 50)
 *         required: false
 *     responses:
 *       '200':
 *         description: Reports successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedReportsResponse'
 *       '400':
 *         description: Bad request (invalid query parameters)
 *       '403':
 *         description: Unauthorized
 *       '429':
 *         description: Too many requests (rate limit exceeded)
 *       '500':
 *         description: Internal server error
 *
 *   post:
 *     tags: [Reports]
 *     summary: Create a report
 *     description: |
 *       Creates a report in the system.
 *       Requires authentication.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReportRequest'
 *     responses:
 *       '201':
 *         description: Report created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Report created successfully"
 *       '400':
 *         description: Bad request
 *       '401':
 *         description: Unauthenticated
 *       '429':
 *         description: Too many requests (rate limit exceeded)
 *       '500':
 *         description: Internal server error
 */
router.get("/reports", generalApiLimiter, requireAuth, getAllReports);
router.post("/reports", reportCreationLimiter, requireAuth, createReport);

/**
 * @openapi
 * /reports/{id}:
 *   get:
 *     tags: [Reports]
 *     summary: Get a report by ID (Admin/Moderator only)
 *     description: |
 *       Retrieves detailed information about a specific report.
 *       Requires admin or moderator authentication.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: The unique identifier of the report
 *         example: 7
 *     responses:
 *       '200':
 *         description: Report successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Report'
 *       '400':
 *         description: Bad request (invalid report ID format)
 *       '403':
 *         description: Unauthorized (requires admin/moderator role)
 *       '404':
 *         description: Report not found
 *       '429':
 *         description: Too many requests (rate limit exceeded)
 *       '500':
 *         description: Internal server error
 *
 *   put:
 *     tags: [Reports]
 *     summary: Update report status (Admin/Moderator only)
 *     description: |
 *       Updates the status of a specific report and optionally adds moderator notes.
 *       Requires admin or moderator authentication.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: The unique identifier of the report
 *         example: 7
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateReportStatusRequest'
 *     responses:
 *       '200':
 *         description: Report status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Report status updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Report'
 *       '400':
 *         description: Bad request (invalid report ID or status data)
 *       '403':
 *         description: Unauthorized (requires admin/moderator role)
 *       '404':
 *         description: Report not found
 *       '429':
 *         description: Too many requests (rate limit exceeded)
 *       '500':
 *         description: Internal server error
 *
 *   delete:
 *     tags: [Reports]
 *     summary: Delete a report (Admin/Moderator only)
 *     description: |
 *       Permanently deletes a report from the system.
 *       Requires admin or moderator authentication.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: The unique identifier of the report
 *         example: 7
 *     responses:
 *       '200':
 *         description: Report deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Report deleted successfully"
 *       '400':
 *         description: Bad request (invalid report ID format)
 *       '403':
 *         description: Unauthorized (requires admin/moderator role)
 *       '404':
 *         description: Report not found
 *       '429':
 *         description: Too many requests (rate limit exceeded)
 *       '500':
 *         description: Internal server error
 */
router.get("/reports/:id", generalApiLimiter, requireAuth, getReportById);
router.put(
  "/reports/:id",
  reportModerationLimiter,
  requireAuth,
  updateReportStatus
);
router.delete(
  "/reports/:id",
  reportModerationLimiter,
  requireAuth,
  deleteReport
);

/**
 * @openapi
 * /reports/toggle-visibility:
 *   patch:
 *     tags: [Reports]
 *     summary: Toggle content visibility (Admin/Moderator only)
 *     description: |
 *       Hides or unhides a reported post or comment.
 *       This endpoint allows moderators to quickly toggle the visibility of content
 *       without fully deleting it. Hidden content is not visible to regular users
 *       but can be restored by moderators.
 *       Requires admin or moderator authentication.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ToggleVisibilityRequest'
 *           examples:
 *             hidePost:
 *               summary: Hide a post
 *               value:
 *                 resourceType: post
 *                 resourceId: "f8b6e3d2-c4a0-4b1e-8f5c-9a7d3b2c1f0e"
 *                 hidden: true
 *             unhidePost:
 *               summary: Unhide a post
 *               value:
 *                 resourceType: post
 *                 resourceId: "f8b6e3d2-c4a0-4b1e-8f5c-9a7d3b2c1f0e"
 *                 hidden: false
 *             hideComment:
 *               summary: Hide a comment
 *               value:
 *                 resourceType: comment
 *                 resourceId: 42
 *                 hidden: true
 *             unhideComment:
 *               summary: Unhide a comment
 *               value:
 *                 resourceType: comment
 *                 resourceId: 42
 *                 hidden: false
 *     responses:
 *       '200':
 *         description: Content visibility toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Successfully hid post"
 *             examples:
 *               hidPost:
 *                 summary: Post hidden
 *                 value:
 *                   message: "Successfully hid post"
 *               unhidPost:
 *                 summary: Post unhidden
 *                 value:
 *                   message: "Successfully unhid post"
 *               hidComment:
 *                 summary: Comment hidden
 *                 value:
 *                   message: "Successfully hid comment"
 *               unhidComment:
 *                 summary: Comment unhidden
 *                 value:
 *                   message: "Successfully unhid comment"
 *       '400':
 *         description: Bad request (invalid resource type, ID, or hidden value)
 *       '403':
 *         description: Unauthorized (requires admin/moderator role)
 *       '404':
 *         description: Post or comment not found
 *       '429':
 *         description: Too many requests (rate limit exceeded)
 *       '500':
 *         description: Internal server error
 */
router.patch(
  "/reports/toggle-visibility",
  reportModerationLimiter,
  requireAuth,
  toggleVisibility
);

export default router;
