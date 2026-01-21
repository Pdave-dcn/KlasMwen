import { createLogger } from "../../core/config/logger.js";

import {
  handleDisconnect,
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

    socket.on("chat:join", handleJoinGroup(socket));
    socket.on("chat:leave", handleLeaveGroup(socket));
    socket.on("disconnect", handleDisconnect(socket));
  });

  logger.info("Chat socket handlers registered");
};
