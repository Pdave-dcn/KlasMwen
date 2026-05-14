/* eslint-disable no-console */
import { listenToNotifications } from "./listeners/notificationListener";
import { listenToPresence } from "./listeners/presenceListener";

import type { Socket } from "socket.io-client";

export const registerListeners = (socket: Socket) => {
  socket.on("connect_error", (error) => {
    console.error("Socket.io connection error:", error);
  });

  listenToNotifications(socket);
  listenToPresence(socket);
};
