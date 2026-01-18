import { createLogger } from "../../../core/config/logger.js";
import { ChatGroupIdParamSchema as ChatGroupIdSchema } from "../../../zodSchemas/chat.zod.js";

import type UserService from "../../../features/user/service/UserService.js";
import type { Socket } from "socket.io";

const logger = createLogger({ module: "ChatSocket" });

/**
 * Handle user leaving a chat group room
 */
export const handleLeaveGroup = (socket: Socket) => {
  return async (
    data: { chatGroupId: string },
    callback?: (response: { success: boolean }) => void,
  ) => {
    try {
      const { chatGroupId } = ChatGroupIdSchema.parse(data);

      const user = socket.data.user as Awaited<
        ReturnType<typeof UserService.getUserForSocket>
      >;

      logger.info({ userId: user.id, chatGroupId }, "User leaving chat group");

      await socket.leave(`chat:${chatGroupId}`);
      socket.data.joinedChatGroups?.delete(chatGroupId);

      socket.to(`chat:${chatGroupId}`).emit("chat:member_left", {
        user: {
          id: user.id,
          username: user.username,
        },
      });

      callback?.({ success: true });
    } catch (error) {
      logger.error(
        { userId: socket.data.user.id, error },
        "Error leaving chat group",
      );

      callback?.({ success: false });
    }
  };
};
