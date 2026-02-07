import handleZodValidationError from "@/utils/zodErrorHandler.util";
import {
  ChatMessagesResponseSchema,
  ChatMessageResponseSchema,
  type SendMessageData,
} from "@/zodSchemas/chat.zod";

import api from "../api";

export const sendChatMessage = async (
  chatGroupId: string,
  data: SendMessageData,
) => {
  try {
    const res = await api.post(`/groups/${chatGroupId}/message`, data);
    const validatedData = ChatMessageResponseSchema.parse(res.data);
    return validatedData.data;
  } catch (error) {
    handleZodValidationError(error, "sendChatMessage");
    throw error;
  }
};

export const getChatMessages = async (
  chatGroupId: string,
  cursor?: number,
  limit: number = 50,
) => {
  try {
    const res = await api.get(`/groups/${chatGroupId}/messages`, {
      params: { cursor, limit },
    });
    const validatedData = ChatMessagesResponseSchema.parse(res.data);
    return validatedData;
  } catch (error) {
    handleZodValidationError(error, "getChatMessages");
    throw error;
  }
};

export const deleteChatMessage = async (
  chatGroupId: string,
  messageId: number,
) => {
  try {
    await api.delete(`/groups/${chatGroupId}/messages/${messageId}`);
  } catch (error) {
    handleZodValidationError(error, "deleteChatMessage");
    throw error;
  }
};
