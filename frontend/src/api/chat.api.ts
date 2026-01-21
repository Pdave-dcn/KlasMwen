import handleZodValidationError from "@/utils/zodErrorHandler.util";
import {
  ChatGroupsResponseSchema,
  ChatGroupResponseSchema,
  ChatMembersResponseSchema,
  ChatMemberResponseSchema,
  ChatMessagesResponseSchema,
  ChatMessageResponseSchema,
  type CreateChatGroupData,
  type UpdateChatGroupData,
  type AddMemberData,
  type UpdateMemberRoleData,
  type SendMessageData,
} from "@/zodSchemas/chat.zod";

import api from "./api";


const createChatGroup = async (data: CreateChatGroupData) => {
  try {
    const res = await api.post("/groups", data);
    const validatedData = ChatGroupResponseSchema.parse(res.data);

    return validatedData.data;
  } catch (error) {
    handleZodValidationError(error, "createChatGroup");
    throw error;
  }
};

const getUserChatGroups = async () => {
  try {
    const res = await api.get("/groups");
    const validatedData = ChatGroupsResponseSchema.parse(res.data);

    return validatedData.data;
  } catch (error) {
    handleZodValidationError(error, "getUserChatGroups");
    throw error;
  }
};

const getChatGroupById = async (chatGroupId: string) => {
  try {
    const res = await api.get(`/groups/${chatGroupId}`);
    const validatedData = ChatGroupResponseSchema.parse(res.data);

    return validatedData.data;
  } catch (error) {
    handleZodValidationError(error, "getChatGroupById");
    throw error;
  }
};

const updateChatGroup = async (
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

const deleteChatGroup = async (chatGroupId: string) => {
  try {
    await api.delete(`/groups/${chatGroupId}`);
  } catch (error) {
    handleZodValidationError(error, "deleteChatGroup");
    throw error;
  }
};

// Chat Member APIs

const addChatMember = async (chatGroupId: string, data: AddMemberData) => {
  try {
    const res = await api.post(`/groups/${chatGroupId}/members`, data);
    const validatedData = ChatMemberResponseSchema.parse(res.data);

    return validatedData.data;
  } catch (error) {
    handleZodValidationError(error, "addChatMember");
    throw error;
  }
};

const getChatMembers = async (chatGroupId: string) => {
  try {
    const res = await api.get(`/groups/${chatGroupId}/members`);
    const validatedData = ChatMembersResponseSchema.parse(res.data);

    return validatedData.data;
  } catch (error) {
    handleZodValidationError(error, "getChatMembers");
    throw error;
  }
};

const removeChatMember = async (chatGroupId: string, userId: string) => {
  try {
    await api.delete(`/groups/${chatGroupId}/members/${userId}`);
  } catch (error) {
    handleZodValidationError(error, "removeChatMember");
    throw error;
  }
};

const updateChatMemberRole = async (
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

// Chat Message APIs

const sendChatMessage = async (chatGroupId: string, data: SendMessageData) => {
  try {
    const res = await api.post(`/groups/${chatGroupId}/messages`, data);
    const validatedData = ChatMessageResponseSchema.parse(res.data);

    return validatedData.data;
  } catch (error) {
    handleZodValidationError(error, "sendChatMessage");
    throw error;
  }
};

const getChatMessages = async (
  chatGroupId: string,
  cursor?: number,
  limit: number = 50,
) => {
  try {
    const params = new URLSearchParams();
    if (cursor) params.append("cursor", cursor.toString());
    params.append("limit", limit.toString());

    const res = await api.get(`/groups/${chatGroupId}/messages?${params}`);
    const validatedData = ChatMessagesResponseSchema.parse(res.data);

    return validatedData;
  } catch (error) {
    handleZodValidationError(error, "getChatMessages");
    throw error;
  }
};

const deleteChatMessage = async (chatGroupId: string, messageId: number) => {
  try {
    await api.delete(`/groups/${chatGroupId}/messages/${messageId}`);
  } catch (error) {
    handleZodValidationError(error, "deleteChatMessage");
    throw error;
  }
};

export {
  // Groups
  createChatGroup,
  getUserChatGroups,
  getChatGroupById,
  updateChatGroup,
  deleteChatGroup,
  // Members
  addChatMember,
  getChatMembers,
  removeChatMember,
  updateChatMemberRole,
  // Messages
  sendChatMessage,
  getChatMessages,
  deleteChatMessage,
};
