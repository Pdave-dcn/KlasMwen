import { PresenceService } from "./presence.service";

import type UserService from "../../features/user/service/UserService";
import type { Socket, Server } from "socket.io";

const handlePresenceConnect = (io: Server, socket: Socket) => {
  const userId = (
    socket.data.user as Awaited<ReturnType<typeof UserService.getUserForSocket>>
  ).id;

  const isFirst = PresenceService.userConnected(userId, socket.id);

  if (isFirst) {
    io.emit("presence:user_online", { userId });
  }
};

const handlePresenceDisconnect = (io: Server, socket: Socket) => {
  const userId = (
    socket.data.user as Awaited<ReturnType<typeof UserService.getUserForSocket>>
  ).id;

  const isLast = PresenceService.userDisconnected(userId, socket.id);

  if (isLast) {
    io.emit("presence:user_offline", { userId });
  }
};

export { handlePresenceConnect, handlePresenceDisconnect };
