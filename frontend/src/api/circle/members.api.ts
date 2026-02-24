import handleZodValidationError from "@/utils/zodErrorHandler.util";
import {
  ChatMembersResponseSchema,
  ChatMemberResponseSchema,
  type AddMemberData,
  type UpdateMemberRoleData,
} from "@/zodSchemas/chat.zod";

import api from "../api";

export const addCircleMember = async (
  circleId: string,
  data: AddMemberData,
) => {
  try {
    const res = await api.post(`/circles/${circleId}/members`, data);
    const validatedData = ChatMemberResponseSchema.parse(res.data);
    return validatedData.data;
  } catch (error) {
    handleZodValidationError(error, "addCircleMember");
    throw error;
  }
};

export const getCircleMembers = async (circleId: string) => {
  try {
    const res = await api.get(`/circles/${circleId}/members`);
    const validatedData = ChatMembersResponseSchema.parse(res.data);
    return validatedData.data;
  } catch (error) {
    handleZodValidationError(error, "getCircleMembers");
    throw error;
  }
};

export const removeCircleMember = async (circleId: string, userId: string) => {
  try {
    await api.delete(`/circles/${circleId}/members/${userId}`);
  } catch (error) {
    handleZodValidationError(error, "removeCircleMember");
    throw error;
  }
};

export const updateCircleMemberRole = async (
  circleId: string,
  userId: string,
  data: UpdateMemberRoleData,
) => {
  try {
    const res = await api.patch(`/circles/${circleId}/members/${userId}`, data);
    const validatedData = ChatMemberResponseSchema.parse(res.data);
    return validatedData.data;
  } catch (error) {
    handleZodValidationError(error, "updateCircleMemberRole");
    throw error;
  }
};

export const updateCircleMemberLastReadAt = async (circleId: string) => {
  try {
    await api.post(`/circles/${circleId}/members/me/read`);
  } catch (error) {
    handleZodValidationError(error, "updateCircleMemberLastReadAt");
    throw error;
  }
};
