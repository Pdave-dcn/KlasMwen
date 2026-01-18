import { createLogger } from "../../../core/config/logger.js";

import type UserService from "../../../features/user/service/UserService.js";
import type { Socket } from "socket.io";

const logger = createLogger({ module: "ChatSocket" });

/**
 * Handle user disconnect - cleanup rooms
 */
export const handleDisconnect = (socket: Socket) => {
  return () => {
    const user = socket.data.user as Awaited<
      ReturnType<typeof UserService.getUserForSocket>
    >;

    logger.info(
      { userId: user.id, socketId: socket.id },
      "User disconnected from chat",
    );

    const joinedGroups = socket.data.joinedChatGroups as Set<string>;

    if (joinedGroups) {
      for (const chatGroupId of joinedGroups) {
        socket.to(`chat:${chatGroupId}`).emit("chat:member_left", {
          user: {
            id: user.id,
            username: user.username,
          },
        });
      }
    }
  };
};
