import { createLogger } from "../../core/config/logger.js";

import {
  handleDisconnect,
  handleDiscoveryWatch,
  handleDiscoveryUnwatch,
  handleJoinCircle,
  handleLeaveCircle,
} from "./handlers/index.js";

import type { Namespace, Socket } from "socket.io";

const logger = createLogger({ module: "StudyCircleSocket" });

/**
 * Register Socket.io event handlers for the study circle namespace.
 * Handles real-time chat operations like joining/leaving rooms.
 */
export const registerCircleSocketHandlers = (nsp: Namespace) => {
  nsp.on("connection", (socket: Socket) => {
    const user = socket.data.user;

    logger.info(
      { userId: user.id, username: user.username, socketId: socket.id },
      "User connected to study circle namespace",
    );

    socket.on("circle:join_room", handleJoinCircle(socket, nsp));
    socket.on("circle:leave_room", handleLeaveCircle(socket, nsp));

    socket.on("circle:watch_discovery", handleDiscoveryWatch(socket, nsp));
    socket.on("circle:unwatch_discovery", handleDiscoveryUnwatch(socket));

    socket.on("disconnect", handleDisconnect(socket, nsp));
  });

  logger.info("Study circle socket handlers registered");
};
