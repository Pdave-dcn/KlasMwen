import handleZodValidationError from "@/utils/zodErrorHandler.util";
import {
  ChatMembersResponseSchema,
  ChatMemberResponseSchema,
  type AddMemberData,
  type UpdateMemberRoleData,
} from "@/zodSchemas/chat.zod";

import api from "../api";

export const addChatMember = async (
  chatGroupId: string,
  data: AddMemberData,
) => {
  try {
    const res = await api.post(`/groups/${chatGroupId}/members`, data);
    const validatedData = ChatMemberResponseSchema.parse(res.data);
    return validatedData.data;
  } catch (error) {
    handleZodValidationError(error, "addChatMember");
    throw error;
  }
};

export const getChatMembers = async (chatGroupId: string) => {
  try {
    const res = await api.get(`/groups/${chatGroupId}/members`);
    const validatedData = ChatMembersResponseSchema.parse(res.data);
    return validatedData.data;
  } catch (error) {
    handleZodValidationError(error, "getChatMembers");
    throw error;
  }
};

export const removeChatMember = async (chatGroupId: string, userId: string) => {
  try {
    await api.delete(`/groups/${chatGroupId}/members/${userId}`);
  } catch (error) {
    handleZodValidationError(error, "removeChatMember");
    throw error;
  }
};

export const updateChatMemberRole = async (
  chatGroupId: string,
  userId: string,
  data: UpdateMemberRoleData,
) => {
  try {
    const res = await api.patch(
      `/groups/${chatGroupId}/members/${userId}`,
      data,
    );
    const validatedData = ChatMemberResponseSchema.parse(res.data);
    return validatedData.data;
  } catch (error) {
    handleZodValidationError(error, "updateChatMemberRole");
    throw error;
  }
};

export const updateChatMemberLastReadAt = async (chatGroupId: string) => {
  try {
    await api.post(`/groups/${chatGroupId}/members/me/read`);
  } catch (error) {
    handleZodValidationError(error, "updateChatMemberLastReadAt");
    throw error;
  }
};
