import { createLogger } from "../../core/config/logger.js";

import {
  handleDisconnect,
  handleDiscoveryWatch,
  handleDiscoveryUnwatch,
  handleJoinGroup,
  handleLeaveGroup,
} from "./handlers/index.js";

import type { Namespace, Socket } from "socket.io";

const logger = createLogger({ module: "ChatSocket" });

/**
 * Register Socket.io event handlers for the chat namespace.
 * Handles real-time chat operations like joining/leaving rooms.
 */
export const registerChatSocketHandlers = (nsp: Namespace) => {
  nsp.on("connection", (socket: Socket) => {
    const user = socket.data.user;

    logger.info(
      { userId: user.id, username: user.username, socketId: socket.id },
      "User connected to chat namespace",
    );

    socket.on("chat:join", handleJoinGroup(socket, nsp));
    socket.on("chat:leave", handleLeaveGroup(socket, nsp));

    socket.on("chat:discovery_watch", handleDiscoveryWatch(socket, nsp));
    socket.on("chat:discovery_unwatch", handleDiscoveryUnwatch(socket));

    socket.on("disconnect", handleDisconnect(socket, nsp));
  });

  logger.info("Chat socket handlers registered");
};
