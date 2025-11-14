import handleZodValidationError from "@/utils/zodErrorHandler.util";
import {
  ActiveReasonsResponseSchema,
  CreateReportRequestSchema,
  ReportSchema,
  ReportsResponseSchema,
  ToggleVisibilityRequestSchema,
  UpdateReportStatusRequestSchema,
  type ReportStatusEnum,
  type CreateReportRequest,
  type UpdateReportStatusRequest,
  type ToggleVisibilityRequest,
  UpdatedReportResponseSchema,
  ReportStatsResponseSchema,
} from "@/zodSchemas/report.zod";

import api from "./api";

/**
 * Get available report reasons
 */
const getReportReasons = async () => {
  try {
    const res = await api.get("/reports/reasons");

    const validatedData = ActiveReasonsResponseSchema.parse(res.data);

    return validatedData.data;
  } catch (error) {
    handleZodValidationError(error, "getReportReasons");
    throw error;
  }
};

const getReportStats = async () => {
  try {
    const res = await api.get("/reports/stats");
    const validatedData = ReportStatsResponseSchema.parse(res.data);
    return validatedData.data;
  } catch (error) {
    handleZodValidationError(error, "getReportStats");
    throw error;
  }
};

/**
 * Get all reports with optional filters and pagination
 */
const getAllReports = async (params?: {
  status?: ReportStatusEnum;
  postId?: string;
  commentId?: number;
  page?: number;
  limit?: number;
}) => {
  try {
    const res = await api.get("/reports", { params });

    const validatedData = ReportsResponseSchema.parse(res.data);

    return validatedData;
  } catch (error) {
    handleZodValidationError(error, "getAllReports");
    throw error;
  }
};

/**
 * Create a new report
 */
const createReport = async (data: CreateReportRequest) => {
  try {
    // Validate request data
    CreateReportRequestSchema.parse(data);

    const res = await api.post("/reports", data);

    return res.data;
  } catch (error) {
    handleZodValidationError(error, "createReport");
    throw error;
  }
};

/**
 * Get a report by ID
 */
const getReportById = async (id: number) => {
  try {
    const res = await api.get(`/reports/${id}`);

    const validatedData = ReportSchema.parse(res.data.data);

    return validatedData;
  } catch (error) {
    handleZodValidationError(error, "getReportById");
    throw error;
  }
};

/**
 * Update report status
 */
const updateReportStatus = async (
  id: number,
  data: UpdateReportStatusRequest
) => {
  try {
    UpdateReportStatusRequestSchema.parse(data);

    const res = await api.put(`/reports/${id}`, data);

    const validatedData = UpdatedReportResponseSchema.parse(res.data);

    return validatedData.data;
  } catch (error) {
    handleZodValidationError(error, "updateReportStatus");
    throw error;
  }
};

/**
 * Delete a report
 */
const deleteReport = async (id: number) => {
  try {
    const res = await api.delete(`/reports/${id}`);

    return res.data;
  } catch (error) {
    handleZodValidationError(error, "deleteReport");
    throw error;
  }
};

/**
 * Toggle content visibility (hide/unhide posts or comments)
 */
const toggleVisibility = async (data: ToggleVisibilityRequest) => {
  try {
    // Validate request data
    ToggleVisibilityRequestSchema.parse(data);

    const res = await api.patch("/reports/toggle-visibility", data);

    return res.data;
  } catch (error) {
    handleZodValidationError(error, "toggleVisibility");
    throw error;
  }
};

export {
  getReportReasons,
  getReportStats,
  getAllReports,
  createReport,
  getReportById,
  updateReportStatus,
  deleteReport,
  toggleVisibility,
};
