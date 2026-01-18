import { createLogger } from "../../../core/config/logger.js";
import {
  ChatGroupNotFoundError,
  NotAMemberError,
} from "../../../core/error/custom/chat.error.js";
import ChatService from "../../../features/chat/service/ChatService.js";
import { ChatGroupIdParamSchema as ChatGroupIdSchema } from "../../../zodSchemas/chat.zod.js";

import type UserService from "../../../features/user/service/UserService.js";
import type { Socket } from "socket.io";

const logger = createLogger({ module: "ChatSocket" });

/**
 * Handle user joining a chat group room
 */
export const handleJoinGroup = (socket: Socket) => {
  return async (
    data: { chatGroupId: string },
    callback?: (response: { success: boolean; error?: string }) => void,
  ) => {
    try {
      const { chatGroupId } = ChatGroupIdSchema.parse(data);

      const user = socket.data.user as Awaited<
        ReturnType<typeof UserService.getUserForSocket>
      >;

      logger.info(
        { userId: user.id, chatGroupId, socketId: socket.id },
        "User joining chat group",
      );

      // Validate group exists and user is a member
      await ChatService.verifyGroupExists(chatGroupId);
      const isMember = await ChatService.isMember(user.id, chatGroupId);

      if (!isMember) {
        throw new NotAMemberError(user.id, chatGroupId);
      }

      // Join the room
      await socket.join(`chat:${chatGroupId}`);
      socket.data.joinedChatGroups ??= new Set<string>();
      socket.data.joinedChatGroups.add(chatGroupId);

      socket.to(`chat:${chatGroupId}`).emit("chat:member_joined", {
        user: {
          id: user.id,
          username: user.username,
        },
      });

      logger.info(
        { userId: user.id, chatGroupId },
        "User joined chat group room",
      );

      callback?.({ success: true });
    } catch (error) {
      logger.error(
        { userId: socket.data.user.id, chatGroupId: data.chatGroupId, error },
        "Error joining chat group",
      );

      if (error instanceof ChatGroupNotFoundError) {
        callback?.({ success: false, error: "Chat group not found" });
      } else if (error instanceof NotAMemberError) {
        callback?.({ success: false, error: "Not a member of this group" });
      } else {
        callback?.({ success: false, error: "Failed to join chat group" });
      }
    }
  };
};
