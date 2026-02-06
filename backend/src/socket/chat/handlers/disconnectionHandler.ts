import { createLogger } from "../../../core/config/logger.js";
import { broadcastPresenceUpdate } from "../helpers/broadcastPresenceUpdate.js";

import type UserService from "../../../features/user/service/UserService.js";
import type { Namespace, Socket } from "socket.io";

const logger = createLogger({ module: "ChatSocket" });

/**
 * Handles cleaning up when a student leaves the app or closes their tab.
 *
 * This function:
 * 1. Identifies which chat groups the student was actually looking at.
 * 2. Tells people inside those chats that the student has left.
 * 3. Updates the "Active Count" for people looking at the dashboard.
 */
export const handleDisconnect = (socket: Socket, nsp: Namespace) => {
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
        // Notify people INSIDE the chat room
        socket.to(`chat:${chatGroupId}`).emit("chat:member_left", {
          user: {
            id: user.id,
            username: user.username,
          },
        });

        // Update the count for people watching from the HUB
        void broadcastPresenceUpdate(chatGroupId, nsp);
      }
    }
  };
};
