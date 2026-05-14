import { describe, it, expect, vi, beforeEach } from "vitest";

import CircleRepository from "../../../src/features/circle/service/Repositories/CircleRepository.js";
import { PresenceService } from "../../../src/socket/presence/presence.service.js";
import {
  handlePresenceConnect,
  handlePresenceDisconnect,
} from "../../../src/socket/presence/presence.handler.js";

vi.mock(
  "../../../src/features/circle/service/Repositories/CircleRepository.js",
  () => ({
    default: {
      findAllContacts: vi.fn(),
    },
  }),
);

vi.mock("../../../src/socket/presence/presence.service.js", () => ({
  PresenceService: {
    userConnected: vi.fn(),
    userDisconnected: vi.fn(),
  },
}));

function makeSocket(userId: string) {
  return {
    id: `socket-${userId}`,
    data: { user: { id: userId, username: `user${userId}` } },
  } as any;
}

function makeIO() {
  const toMock = vi.fn();
  const emitMock = vi.fn();

  return {
    to: toMock.mockReturnValue({ emit: emitMock }),
    _emitSpies: { toMock, emitMock },
  } as any;
}

describe("Presence Handlers", () => {
  let io: any;
  let socket: any;

  beforeEach(() => {
    io = makeIO();
    socket = makeSocket("user1");
    vi.clearAllMocks();
  });

  describe("handlePresenceConnect", () => {
    it("broadcasts online event to all contacts on first connection", async () => {
      const contactIds = ["user2", "user3", "user4"];

      (PresenceService.userConnected as any).mockReturnValue(true); // first connection
      (CircleRepository.findAllContacts as any).mockResolvedValue(contactIds);

      const result = await handlePresenceConnect(io, socket);

      // should emit to each contact
      expect(io._emitSpies.toMock).toHaveBeenCalledWith("user:user2");
      expect(io._emitSpies.toMock).toHaveBeenCalledWith("user:user3");
      expect(io._emitSpies.toMock).toHaveBeenCalledWith("user:user4");
      expect(io._emitSpies.toMock).toHaveBeenCalledTimes(3);

      // each emit should send presence:user_online
      expect(io._emitSpies.emitMock).toHaveBeenCalledWith(
        "presence:user_online",
        { userId: "user1" },
      );
      expect(io._emitSpies.emitMock).toHaveBeenCalledTimes(3);

      // return contactIds
      expect(result).toEqual(contactIds);
    });

    it("does not broadcast when user connects with a second tab", async () => {
      const contactIds = ["user2", "user3"];

      (PresenceService.userConnected as any).mockReturnValue(false); // not first connection
      (CircleRepository.findAllContacts as any).mockResolvedValue(contactIds);

      const result = await handlePresenceConnect(io, socket);

      // should still fetch contacts but NOT emit
      expect(CircleRepository.findAllContacts).toHaveBeenCalledWith("user1");
      expect(io._emitSpies.toMock).not.toHaveBeenCalled();
      expect(io._emitSpies.emitMock).not.toHaveBeenCalled();

      // but still return contactIds
      expect(result).toEqual(contactIds);
    });

    it("handles empty contact list gracefully", async () => {
      (PresenceService.userConnected as any).mockReturnValue(true);
      (CircleRepository.findAllContacts as any).mockResolvedValue([]);

      const result = await handlePresenceConnect(io, socket);

      expect(io._emitSpies.toMock).not.toHaveBeenCalled();
      expect(io._emitSpies.emitMock).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it("correctly extracts user.id from socket.data.user", async () => {
      (PresenceService.userConnected as any).mockReturnValue(true);
      (CircleRepository.findAllContacts as any).mockResolvedValue(["user2"]);

      await handlePresenceConnect(io, socket);

      expect(PresenceService.userConnected).toHaveBeenCalledWith(
        "user1",
        "socket-user1",
      );
      expect(CircleRepository.findAllContacts).toHaveBeenCalledWith("user1");
    });
  });

  describe("handlePresenceDisconnect", () => {
    it("broadcasts offline event to all contacts on final disconnect", async () => {
      const contactIds = ["user2", "user3", "user4"];

      (PresenceService.userDisconnected as any).mockReturnValue(true); // last connection
      (CircleRepository.findAllContacts as any).mockResolvedValue(contactIds);

      await handlePresenceDisconnect(io, socket);

      // should emit to each contact
      expect(io._emitSpies.toMock).toHaveBeenCalledWith("user:user2");
      expect(io._emitSpies.toMock).toHaveBeenCalledWith("user:user3");
      expect(io._emitSpies.toMock).toHaveBeenCalledWith("user:user4");
      expect(io._emitSpies.toMock).toHaveBeenCalledTimes(3);

      // each emit should send presence:user_offline
      expect(io._emitSpies.emitMock).toHaveBeenCalledWith(
        "presence:user_offline",
        { userId: "user1" },
      );
      expect(io._emitSpies.emitMock).toHaveBeenCalledTimes(3);
    });

    it("does not broadcast when user disconnects but still has other tabs open", async () => {
      const contactIds = ["user2", "user3"];

      (PresenceService.userDisconnected as any).mockReturnValue(false); // not last connection
      (CircleRepository.findAllContacts as any).mockResolvedValue(contactIds);

      await handlePresenceDisconnect(io, socket);

      // should check presence but NOT emit
      expect(PresenceService.userDisconnected).toHaveBeenCalledWith(
        "user1",
        "socket-user1",
      );
      expect(io._emitSpies.toMock).not.toHaveBeenCalled();
      expect(io._emitSpies.emitMock).not.toHaveBeenCalled();

      // should NOT fetch contacts either when not last
      expect(CircleRepository.findAllContacts).not.toHaveBeenCalled();
    });

    it("handles empty contact list on final disconnect", async () => {
      (PresenceService.userDisconnected as any).mockReturnValue(true);
      (CircleRepository.findAllContacts as any).mockResolvedValue([]);

      await handlePresenceDisconnect(io, socket);

      expect(CircleRepository.findAllContacts).toHaveBeenCalledWith("user1");
      expect(io._emitSpies.toMock).not.toHaveBeenCalled();
      expect(io._emitSpies.emitMock).not.toHaveBeenCalled();
    });

    it("correctly extracts user.id from socket.data.user on disconnect", async () => {
      (PresenceService.userDisconnected as any).mockReturnValue(true);
      (CircleRepository.findAllContacts as any).mockResolvedValue(["user2"]);

      await handlePresenceDisconnect(io, socket);

      expect(PresenceService.userDisconnected).toHaveBeenCalledWith(
        "user1",
        "socket-user1",
      );
      expect(CircleRepository.findAllContacts).toHaveBeenCalledWith("user1");
    });
  });

  describe("broadcast count accuracy and integration", () => {
    it("broadcasts correct count for multiple users connecting in sequence", async () => {
      // User 1 first tab
      (PresenceService.userConnected as any).mockReturnValue(true);
      (CircleRepository.findAllContacts as any).mockResolvedValue([
        "user2",
        "user3",
      ]);
      await handlePresenceConnect(io, socket);
      expect(io._emitSpies.emitMock).toHaveBeenCalledTimes(2);

      // User 1 second tab
      vi.clearAllMocks();
      io = makeIO();
      (PresenceService.userConnected as any).mockReturnValue(false);
      (CircleRepository.findAllContacts as any).mockResolvedValue([
        "user2",
        "user3",
      ]);
      await handlePresenceConnect(io, socket);
      expect(io._emitSpies.emitMock).not.toHaveBeenCalled(); // no broadcast
    });

    it("distinguishes between online and offline events correctly", async () => {
      // First connection
      (PresenceService.userConnected as any).mockReturnValue(true);
      (CircleRepository.findAllContacts as any).mockResolvedValue(["user2"]);
      await handlePresenceConnect(io, socket);

      expect(io._emitSpies.emitMock).toHaveBeenCalledWith(
        "presence:user_online",
        { userId: "user1" },
      );

      // Final disconnect
      vi.clearAllMocks();
      io = makeIO();
      (PresenceService.userDisconnected as any).mockReturnValue(true);
      (CircleRepository.findAllContacts as any).mockResolvedValue(["user2"]);
      await handlePresenceDisconnect(io, socket);

      expect(io._emitSpies.emitMock).toHaveBeenCalledWith(
        "presence:user_offline",
        { userId: "user1" },
      );
    });
  });
});
