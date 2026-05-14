import { io } from "socket.io-client";

import { registerListeners } from "./socketListeners";

let socket: ReturnType<typeof io> | null = null;

export const connectSocket = () => {
  if (socket) return socket;

  socket = io(import.meta.env.VITE_SOCKET_URL, {
    withCredentials: true,
    transports: ["websocket"],
  });

  registerListeners(socket);

  return socket;
};

export const disconnectSocket = () => {
  socket?.removeAllListeners();
  socket?.disconnect();
  socket = null;
};
