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

    void handlePresenceConnect(io, socket);

    socket.on("disconnect", () => {
      void handlePresenceDisconnect(io, socket);
    });
  });
};
