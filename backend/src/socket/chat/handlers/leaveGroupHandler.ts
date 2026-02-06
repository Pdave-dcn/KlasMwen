import { createLogger } from "../../../core/config/logger.js";
import { ChatGroupIdParamSchema as ChatGroupIdSchema } from "../../../zodSchemas/chat.zod.js";
import { broadcastPresenceUpdate } from "../helpers/broadcastPresenceUpdate.js";

import type UserService from "../../../features/user/service/UserService.js";
import type { Namespace, Socket } from "socket.io";

const logger = createLogger({ module: "ChatSocket" });

/**
 * Handles a student manually exiting a chat group.
 *
 * This function:
 * 1. Disconnects the student from the live chat room so they stop receiving messages.
 * 2. Removes the group from the student's "active sessions" list.
 * 3. Tells everyone on the Dashboard/Hub that there is one less person active in this group.
 * 4. Notifies other students still in the room that this person has left.
 * @param socket - The student's individual connection.
 * @param nsp - The overall chat server area.
 */
export const handleLeaveGroup = (socket: Socket, nsp: Namespace) => {
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

      void broadcastPresenceUpdate(chatGroupId, nsp);

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
