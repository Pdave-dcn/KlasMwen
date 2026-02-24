import handleZodValidationError from "@/utils/zodErrorHandler.util";
import {
  ChatMessagesResponseSchema,
  ChatMessageResponseSchema,
  type SendMessageData,
} from "@/zodSchemas/chat.zod";

import api from "../api";

export const sendCircleMessage = async (
  circleId: string,
  data: SendMessageData,
) => {
  try {
    const res = await api.post(`/circles/${circleId}/message`, data);
    const validatedData = ChatMessageResponseSchema.parse(res.data);
    return validatedData.data;
  } catch (error) {
    handleZodValidationError(error, "sendCircleMessage");
    throw error;
  }
};

export const getCircleMessages = async (
  circleId: string,
  cursor?: number,
  limit: number = 50,
) => {
  try {
    const res = await api.get(`/circles/${circleId}/messages`, {
      params: { cursor, limit },
    });
    const validatedData = ChatMessagesResponseSchema.parse(res.data);
    return validatedData;
  } catch (error) {
    handleZodValidationError(error, "getCircleMessages");
    throw error;
  }
};

export const deleteCircleMessage = async (
  circleId: string,
  messageId: number,
) => {
  try {
    await api.delete(`/circles/${circleId}/messages/${messageId}`);
  } catch (error) {
    handleZodValidationError(error, "deleteCircleMessage");
    throw error;
  }
};
