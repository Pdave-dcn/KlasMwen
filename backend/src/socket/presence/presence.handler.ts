import ChatRepository from "../../features/chat/service/ChatRepository";

import { PresenceService } from "./presence.service";

import type UserService from "../../features/user/service/UserService";
import type { Socket, Server } from "socket.io";

const handlePresenceConnect = async (io: Server, socket: Socket) => {
  const user = socket.data.user as Awaited<
    ReturnType<typeof UserService.getUserForSocket>
  >;

  const isFirst = PresenceService.userConnected(user.id, socket.id);

  // Find everyone who shares a group with this user
  const contactIds = await ChatRepository.findAllContacts(user.id);

  if (isFirst) {
    // Emit "online" ONLY to the private rooms of those specific contacts
    contactIds.forEach((contactId) => {
      io.to(`user:${contactId}`).emit("presence:user_online", {
        userId: user.id,
      });
    });
  }

  return contactIds;
};

const handlePresenceDisconnect = async (io: Server, socket: Socket) => {
  const user = socket.data.user as Awaited<
    ReturnType<typeof UserService.getUserForSocket>
  >;
  const isLast = PresenceService.userDisconnected(user.id, socket.id);

  if (isLast) {
    const contactIds = await ChatRepository.findAllContacts(user.id);

    contactIds.forEach((contactId) => {
      io.to(`user:${contactId}`).emit("presence:user_offline", {
        userId: user.id,
      });
    });
  }
};

export { handlePresenceConnect, handlePresenceDisconnect };
