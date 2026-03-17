import handleZodValidationError from "@/utils/zodErrorHandler.util";
import {
  StudyCirclesResponseSchema,
  StudyCircleResponseSchema,
  type CreateStudyCircleData,
  type EditCircleInfoValues,
  StudyCirclePreviewResponseSchema,
  CircleAvatarsResponseSchema,
} from "@/zodSchemas/circle.zod";

import api from "../api";

export const createStudyCircle = async (data: CreateStudyCircleData) => {
  try {
    const res = await api.post("/circles", data);
    const validatedData = StudyCircleResponseSchema.parse(res.data);
    return validatedData.data;
  } catch (error) {
    handleZodValidationError(error, "createStudyCircle");
    throw error;
  }
};

export const joinStudyCircle = async (circleId: string) => {
  try {
    const res = await api.post(`/circles/join/${circleId}`);
    const validatedData = StudyCircleResponseSchema.parse(res.data);
    return validatedData.data;
  } catch (error) {
    handleZodValidationError(error, "joinStudyCircle");
    throw error;
  }
};

export const getUserStudyCircles = async () => {
  try {
    const res = await api.get("/circles");
    const validatedData = StudyCirclesResponseSchema.parse(res.data);
    return validatedData.data;
  } catch (error) {
    handleZodValidationError(error, "getUserStudyCircles");
    throw error;
  }
};

export const getRecentActivityCircles = async (limit: number = 8) => {
  try {
    const res = await api.get("/circles/recent-activity", {
      params: { limit },
    });
    const validatedData = StudyCirclesResponseSchema.parse(res.data);
    return validatedData.data;
  } catch (error) {
    handleZodValidationError(error, "getRecentActivityCircles");
    throw error;
  }
};

export const getStudyCircleById = async (circleId: string) => {
  try {
    const res = await api.get(`/circles/${circleId}`);
    const validatedData = StudyCircleResponseSchema.parse(res.data);
    return validatedData.data;
  } catch (error) {
    handleZodValidationError(error, "getStudyCircleById");
    throw error;
  }
};

export const getCirclePreviewDetails = async (circleId: string) => {
  try {
    const res = await api.get(`/circles/${circleId}/preview`);
    const validatedData = StudyCirclePreviewResponseSchema.parse(res.data);
    return validatedData.data;
  } catch (error) {
    handleZodValidationError(error, "getCirclePreviewDetails");
    throw error;
  }
};

export const updateStudyCircle = async (
  circleId: string,
  data: EditCircleInfoValues,
) => {
  try {
    const res = await api.put(`/circles/${circleId}`, data);
    const validatedData = StudyCircleResponseSchema.parse(res.data);
    return validatedData.data;
  } catch (error) {
    handleZodValidationError(error, "updateStudyCircle");
    throw error;
  }
};

export const deleteStudyCircle = async (circleId: string) => {
  try {
    await api.delete(`/circles/${circleId}`);
  } catch (error) {
    handleZodValidationError(error, "deleteStudyCircle");
    throw error;
  }
};

export const getCircleAvatars = async (
  limit: number,
  cursor?: number | string,
) => {
  try {
    const res = await api.get("/circles/avatars", {
      params: { limit, cursor },
    });
    const validatedData = CircleAvatarsResponseSchema.parse(res.data);
    return validatedData;
  } catch (error) {
    handleZodValidationError(error, "getCircleAvatars");
    throw error;
  }
};
