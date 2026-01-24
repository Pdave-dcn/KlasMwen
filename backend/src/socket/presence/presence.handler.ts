import { ChatGroupService } from "../../features/chat/service/core/ChatGroupService";

import { PresenceService } from "./presence.service";

import type UserService from "../../features/user/service/UserService";
import type { Socket, Server } from "socket.io";

const handlePresenceConnect = async (io: Server, socket: Socket) => {
  const user = socket.data.user as Awaited<
    ReturnType<typeof UserService.getUserForSocket>
  >;
  const isFirst = PresenceService.userConnected(user.id, socket.id);

  if (isFirst) {
    // Get groups the user belongs to
    const groups = await ChatGroupService.getUserGroups(user.id);

    groups.forEach((group) => {
      // Notify other members in those specific group rooms
      io.to(`chat:${group.id}`).emit("presence:user_online", {
        userId: user.id,
      });
    });
  }
};

const handlePresenceDisconnect = async (io: Server, socket: Socket) => {
  const user = socket.data.user as Awaited<
    ReturnType<typeof UserService.getUserForSocket>
  >;
  const isLast = PresenceService.userDisconnected(user.id, socket.id);

  if (isLast) {
    const groups = await ChatGroupService.getUserGroups(user.id);

    groups.forEach((group) => {
      io.to(`chat:${group.id}`).emit("presence:user_offline", {
        userId: user.id,
      });
    });
  }
};

export { handlePresenceConnect, handlePresenceDisconnect };
