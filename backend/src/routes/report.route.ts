import express from "express";

import {
  createReport,
  deleteReport,
  getAllReports,
  getReportById,
  getReportReasons,
  updateReportStatus,
} from "../controllers/report.controller.js";
import {
  generalApiLimiter,
  writeOperationsLimiter,
} from "../middleware/coreRateLimits.middleware.js";
import attachLogContext from "../middleware/logContext.middleware.js";
import { requireAuth } from "../middleware/requireAuth.middleware.js";

const router = express.Router();

router.use(attachLogContext("ReportController"));

router.get("/report-reasons", generalApiLimiter, getReportReasons);

router.post("/reports", writeOperationsLimiter, requireAuth, createReport);

router.get("/reports", generalApiLimiter, requireAuth, getAllReports);
router.get("/reports/:id", generalApiLimiter, requireAuth, getReportById);
router.put(
  "/reports/:id",
  writeOperationsLimiter,
  requireAuth,
  updateReportStatus
);
router.delete(
  "/reports/:id",
  writeOperationsLimiter,
  requireAuth,
  deleteReport
);

export default router;
