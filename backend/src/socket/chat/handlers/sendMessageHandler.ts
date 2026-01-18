import { createLogger } from "../../../core/config/logger.js";
import { NotAMemberError } from "../../../core/error/custom/chat.error.js";
import ChatRepository from "../../../features/chat/service/ChatRepository.js";
import ChatService from "../../../features/chat/service/ChatService.js";
import { SendMessageDataSchema } from "../../../zodSchemas/chat.zod.js";
import {
  handleSendMessageError,
  type SendMessageCallback,
} from "../helpers/handleSendMessageError.js";

import type UserService from "../../../features/user/service/UserService.js";
import type { Socket } from "socket.io";

const logger = createLogger({ module: "ChatSocket" });

const ensureMembership = async (userId: string, chatGroupId: string) => {
  await ChatService.verifyGroupExists(chatGroupId);

  const membership = await ChatRepository.getMembership(userId, chatGroupId);
  if (!membership) {
    throw new NotAMemberError(userId, chatGroupId);
  }

  return membership;
};

/**
 * Handle sending a message to a chat group
 */
export const handleSendMessage = (socket: Socket) => {
  return async (
    data: { chatGroupId: string; content: string },
    callback?: SendMessageCallback,
  ) => {
    const user = socket.data.user as Awaited<
      ReturnType<typeof UserService.getUserForSocket>
    >;

    if (!user) {
      callback?.({ success: false, error: "User not authenticated" });
      return;
    }

    try {
      const { chatGroupId, content } = SendMessageDataSchema.parse(data);

      logger.info({ userId: user.id, chatGroupId }, "User sending message");

      const membership = await ensureMembership(user.id, chatGroupId);

      const message = await ChatService.sendMessage(
        {
          content,
          senderId: user.id,
          chatGroupId,
        },
        { ...user, chatRole: membership.role },
      );

      socket.to(`chat:${chatGroupId}`).emit("chat:new_message", { message });

      logger.info(
        { userId: user.id, chatGroupId, messageId: message.id },
        "Message sent successfully",
      );

      callback?.({ success: true, message });
    } catch (error) {
      handleSendMessageError(error, socket, data.chatGroupId, logger, callback);
    }
  };
};
