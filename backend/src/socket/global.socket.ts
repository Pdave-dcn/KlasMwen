import {
  handlePresenceConnect,
  handlePresenceDisconnect,
} from "./presence/presence.handler.js";
import { PresenceService } from "./presence/presence.service.js";

import type { Server, Socket } from "socket.io";

export const registerSocketHandlers = (io: Server) => {
  io.on("connection", async (socket: Socket) => {
    try {
      const user = socket.data.user;
      const userRoom = `user:${user.id}`;

      // Join personal room and notify everyone who shares a group with me "I'm online"
      await socket.join(userRoom);
      const contactIds = await handlePresenceConnect(io, socket);

      // Tell the new connection who of their contacts is already online
      const onlineUserIds = PresenceService.getOnlineUsersFromList(contactIds);
      socket.emit("presence:sync_initial_state", { onlineUserIds });

      socket.on("disconnect", async () => {
        await handlePresenceDisconnect(io, socket);
      });
    } catch (error) {
      console.error("Socket connection handler error:", error);
    }
  });
};
