import handleZodValidationError from "@/utils/zodErrorHandler.util";
import {
  ChatGroupsResponseSchema,
  ChatGroupResponseSchema,
  type CreateChatGroupData,
  type UpdateChatGroupData,
  ChatGroupPreviewResponseSchema,
} from "@/zodSchemas/chat.zod";

import api from "../api";

export const createStudyCircle = async (data: CreateChatGroupData) => {
  try {
    const res = await api.post("/circles", data);
    const validatedData = ChatGroupResponseSchema.parse(res.data);
    return validatedData.data;
  } catch (error) {
    handleZodValidationError(error, "createStudyCircle");
    throw error;
  }
};

export const joinStudyCircle = async (circleId: string) => {
  try {
    const res = await api.post(`/circles/join/${circleId}`);
    const validatedData = ChatGroupResponseSchema.parse(res.data);
    return validatedData.data;
  } catch (error) {
    handleZodValidationError(error, "joinStudyCircle");
    throw error;
  }
};

export const getUserStudyCircles = async () => {
  try {
    const res = await api.get("/circles");
    const validatedData = ChatGroupsResponseSchema.parse(res.data);
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
    const validatedData = ChatGroupsResponseSchema.parse(res.data);
    return validatedData.data;
  } catch (error) {
    handleZodValidationError(error, "getRecentActivityCircles");
    throw error;
  }
};

export const getStudyCircleById = async (circleId: string) => {
  try {
    const res = await api.get(`/circles/${circleId}`);
    const validatedData = ChatGroupResponseSchema.parse(res.data);
    return validatedData.data;
  } catch (error) {
    handleZodValidationError(error, "getStudyCircleById");
    throw error;
  }
};

export const getCirclePreviewDetails = async (circleId: string) => {
  try {
    const res = await api.get(`/circles/${circleId}/preview`);
    const validatedData = ChatGroupPreviewResponseSchema.parse(res.data);
    return validatedData.data;
  } catch (error) {
    handleZodValidationError(error, "getCirclePreviewDetails");
    throw error;
  }
};

export const updateStudyCircle = async (
  circleId: string,
  data: UpdateChatGroupData,
) => {
  try {
    const res = await api.put(`/circles/${circleId}`, data);
    const validatedData = ChatGroupResponseSchema.parse(res.data);
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
