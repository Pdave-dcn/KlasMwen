import type { MuteDuration } from "@/features/study-circles/settings/types";
import handleZodValidationError from "@/utils/zodErrorHandler.util";
import {
  CircleMembersResponseSchema,
  CircleMemberResponseSchema,
  type AddMemberData,
  type UpdateMemberRoleData,
  UpdateMemberRoleMutationSchema,
} from "@/zodSchemas/circle.zod";

import api from "../api";

export const addCircleMember = async (
  circleId: string,
  data: AddMemberData,
) => {
  try {
    const res = await api.post(`/circles/${circleId}/members`, data);
    const validatedData = CircleMemberResponseSchema.parse(res.data);
    return validatedData.data;
  } catch (error) {
    handleZodValidationError(error, "addCircleMember");
    throw error;
  }
};

export const getCircleMembers = async (circleId: string) => {
  try {
    const res = await api.get(`/circles/${circleId}/members`);
    const validatedData = CircleMembersResponseSchema.parse(res.data);
    return validatedData.data;
  } catch (error) {
    handleZodValidationError(error, "getCircleMembers");
    throw error;
  }
};

export const removeCircleMember = async (circleId: string, userId: string) => {
  await api.delete(`/circles/${circleId}/members/${userId}`);
};

export const updateCircleMemberRole = async (
  circleId: string,
  userId: string,
  data: UpdateMemberRoleData,
) => {
  try {
    UpdateMemberRoleMutationSchema.parse({ userId, circleId, data });
    const res = await api.patch(`/circles/${circleId}/members/${userId}`, data);
    const validatedData = CircleMemberResponseSchema.parse(res.data);
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

export const setCircleMemberMute = async (
  circleId: string,
  userId: string,
  muted: boolean,
  duration?: MuteDuration["value"],
) => {
  try {
    const res = await api.patch(`/circles/${circleId}/members/${userId}/mute`, {
      muted,
      duration,
    });

    const validatedData = CircleMemberResponseSchema.parse(res.data);

    return validatedData.data;
  } catch (error) {
    handleZodValidationError(error, "setCircleMemberMute");
    throw error;
  }
};
