import handleZodValidationError from "@/utils/zodErrorHandler.util";
import {
  ChatGroupsResponseSchema,
  ChatGroupResponseSchema,
  type CreateChatGroupData,
  type UpdateChatGroupData,
  ChatGroupPreviewResponseSchema,
} from "@/zodSchemas/chat.zod";

import api from "../api";

export const createChatGroup = async (data: CreateChatGroupData) => {
  try {
    const res = await api.post("/groups", data);
    const validatedData = ChatGroupResponseSchema.parse(res.data);
    return validatedData.data;
  } catch (error) {
    handleZodValidationError(error, "createChatGroup");
    throw error;
  }
};

export const joinChatGroup = async (chatGroupId: string) => {
  try {
    const res = await api.post(`/groups/join/${chatGroupId}`);
    const validatedData = ChatGroupResponseSchema.parse(res.data);
    return validatedData.data;
  } catch (error) {
    handleZodValidationError(error, "joinChatGroup");
    throw error;
  }
};

export const getUserChatGroups = async () => {
  try {
    const res = await api.get("/groups");
    const validatedData = ChatGroupsResponseSchema.parse(res.data);
    return validatedData.data;
  } catch (error) {
    handleZodValidationError(error, "getUserChatGroups");
    throw error;
  }
};

export const getRecentActivityGroups = async (limit: number = 8) => {
  try {
    const res = await api.get("/groups/recent-activity", { params: { limit } });
    const validatedData = ChatGroupsResponseSchema.parse(res.data);
    return validatedData.data;
  } catch (error) {
    handleZodValidationError(error, "getRecentActivityGroups");
    throw error;
  }
};

export const getChatGroupById = async (chatGroupId: string) => {
  try {
    const res = await api.get(`/groups/${chatGroupId}`);
    const validatedData = ChatGroupResponseSchema.parse(res.data);
    return validatedData.data;
  } catch (error) {
    handleZodValidationError(error, "getChatGroupById");
    throw error;
  }
};

export const getGroupPreviewDetails = async (chatGroupId: string) => {
  try {
    const res = await api.get(`/groups/${chatGroupId}/preview`);
    const validatedData = ChatGroupPreviewResponseSchema.parse(res.data);
    return validatedData.data;
  } catch (error) {
    handleZodValidationError(error, "getGroupDetails");
    throw error;
  }
};

export const updateChatGroup = async (
  chatGroupId: string,
  data: UpdateChatGroupData,
) => {
  try {
    const res = await api.put(`/groups/${chatGroupId}`, data);
    const validatedData = ChatGroupResponseSchema.parse(res.data);
    return validatedData.data;
  } catch (error) {
    handleZodValidationError(error, "updateChatGroup");
    throw error;
  }
};

export const deleteChatGroup = async (chatGroupId: string) => {
  try {
    await api.delete(`/groups/${chatGroupId}`);
  } catch (error) {
    handleZodValidationError(error, "deleteChatGroup");
    throw error;
  }
};
