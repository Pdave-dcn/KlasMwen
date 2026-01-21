import {
  handlePresenceConnect,
  handlePresenceDisconnect,
} from "./presence/presence.handler";

import type { Server, Socket } from "socket.io";

export const registerSocketHandlers = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    const user = socket.data.user;
    const userRoom = `user:${user.id}`;

    void socket.join(userRoom);

    handlePresenceConnect(io, socket);

    socket.on("disconnect", () => {
      handlePresenceDisconnect(io, socket);
    });
  });
};
