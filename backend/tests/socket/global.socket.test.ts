import { describe, it, expect, vi, beforeEach } from "vitest";

import { registerSocketHandlers } from "../../src/socket/global.socket.js";
import { PresenceService } from "../../src/socket/presence/presence.service.js";
import {
  handlePresenceConnect,
  handlePresenceDisconnect,
} from "../../src/socket/presence/presence.handler.js";

vi.mock("../../src/socket/presence/presence.handler.js", () => ({
  handlePresenceConnect: vi.fn(),
  handlePresenceDisconnect: vi.fn(),
}));

vi.mock("../../src/socket/presence/presence.service.js", () => ({
  PresenceService: {
    getOnlineUsersFromList: vi.fn(),
  },
}));

function makeSocket(userId: string) {
  const onListeners: Record<string, Function[]> = {};
  return {
    id: `socket-${userId}`,
    data: { user: { id: userId, username: `user${userId}` } },
    join: vi.fn().mockResolvedValue(undefined),
    emit: vi.fn(),
    on: vi.fn((event: string, callback: Function) => {
      if (!onListeners[event]) {
        onListeners[event] = [];
      }
      onListeners[event].push(callback);
    }),
    // Helper to trigger disconnect event
    _triggerDisconnect: () => {
      const callbacks = onListeners["disconnect"];
      if (callbacks) {
        callbacks.forEach((cb) => cb());
      }
    },
  } as any;
}

function makeIO() {
  const onListeners: Record<string, Function[]> = {};
  return {
    on: vi.fn((event: string, callback: Function) => {
      if (!onListeners[event]) {
        onListeners[event] = [];
      }
      onListeners[event].push(callback);
    }),
    // Helper to trigger connection event
    _triggerConnection: async (socket: any) => {
      const callbacks = onListeners["connection"];
      if (callbacks) {
        for (const cb of callbacks) {
          await cb(socket);
        }
      }
    },
  } as any;
}

describe("registerSocketHandlers integration", () => {
  let io: any;
  let socket: any;
  const consoleErrorSpy = vi
    .spyOn(console, "error")
    .mockImplementation(() => {});

  beforeEach(() => {
    io = makeIO();
    socket = makeSocket("user1");
    vi.clearAllMocks();
    consoleErrorSpy.mockClear();
  });

  describe("connection flow (success path)", () => {
    it("joins user to private room, connects presence, and syncs online state", async () => {
      const contactIds = ["user2", "user3", "user4"];
      const onlineUserIds = ["user2"];

      (handlePresenceConnect as any).mockResolvedValue(contactIds);
      (PresenceService.getOnlineUsersFromList as any).mockReturnValue(
        onlineUserIds,
      );

      registerSocketHandlers(io);
      await io._triggerConnection(socket);

      // Should join private room
      expect(socket.join).toHaveBeenCalledWith("user:user1");

      // Should call presence connect handler
      expect(handlePresenceConnect).toHaveBeenCalledWith(io, socket);

      // Should filter online users from contacts
      expect(PresenceService.getOnlineUsersFromList).toHaveBeenCalledWith(
        contactIds,
      );

      // Should emit initial state with online users
      expect(socket.emit).toHaveBeenCalledWith("presence:sync_initial_state", {
        onlineUserIds,
      });
    });

    it("handles empty contact list correctly", async () => {
      const contactIds: string[] = [];
      const onlineUserIds: string[] = [];

      (handlePresenceConnect as any).mockResolvedValue(contactIds);
      (PresenceService.getOnlineUsersFromList as any).mockReturnValue(
        onlineUserIds,
      );

      registerSocketHandlers(io);
      await io._triggerConnection(socket);

      expect(socket.join).toHaveBeenCalledWith("user:user1");
      expect(handlePresenceConnect).toHaveBeenCalledWith(io, socket);
      expect(socket.emit).toHaveBeenCalledWith("presence:sync_initial_state", {
        onlineUserIds: [],
      });
    });

    it("handles all contacts being online", async () => {
      const contactIds = ["user2", "user3"];
      const onlineUserIds = ["user2", "user3"]; // all online

      (handlePresenceConnect as any).mockResolvedValue(contactIds);
      (PresenceService.getOnlineUsersFromList as any).mockReturnValue(
        onlineUserIds,
      );

      registerSocketHandlers(io);
      await io._triggerConnection(socket);

      expect(socket.emit).toHaveBeenCalledWith("presence:sync_initial_state", {
        onlineUserIds,
      });
    });
  });

  describe("disconnection wiring", () => {
    it("registers disconnect listener and calls handler when triggered", async () => {
      const contactIds = ["user2"];

      (handlePresenceConnect as any).mockResolvedValue(contactIds);
      (PresenceService.getOnlineUsersFromList as any).mockReturnValue([]);

      registerSocketHandlers(io);
      await io._triggerConnection(socket);

      // Verify disconnect listener is registered
      expect(socket.on).toHaveBeenCalledWith(
        "disconnect",
        expect.any(Function),
      );

      // Clear mocks to focus on disconnect
      vi.clearAllMocks();

      // Trigger disconnect
      await socket._triggerDisconnect();

      // Should call the disconnect handler
      expect(handlePresenceDisconnect).toHaveBeenCalledWith(io, socket);
    });

    it("does not call disconnect handler until disconnect is triggered", async () => {
      (handlePresenceConnect as any).mockResolvedValue([]);
      (PresenceService.getOnlineUsersFromList as any).mockReturnValue([]);

      registerSocketHandlers(io);
      await io._triggerConnection(socket);

      // Clear mocks after connection
      vi.clearAllMocks();

      // Disconnect handler should not be called yet
      expect(handlePresenceDisconnect).not.toHaveBeenCalled();
    });
  });

  describe("error resilience", () => {
    it("catches errors from handlePresenceConnect and logs them", async () => {
      const testError = new Error("Connection handler failed");
      (handlePresenceConnect as any).mockRejectedValue(testError);

      registerSocketHandlers(io);
      await io._triggerConnection(socket);

      // Should log the error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Socket connection handler error:",
        testError,
      );

      // Should not emit initial state if connect handler fails
      expect(socket.emit).not.toHaveBeenCalled();
    });

    it("prevents crash when user data is missing", async () => {
      const invalidSocket = {
        id: "socket-invalid",
        data: { user: { id: "user1", username: "test" } },
        join: vi.fn().mockResolvedValue(undefined),
        emit: vi.fn(),
        on: vi.fn(),
      } as any;

      (handlePresenceConnect as any).mockResolvedValue([]);
      (PresenceService.getOnlineUsersFromList as any).mockReturnValue([]);

      registerSocketHandlers(io);

      expect(async () => {
        await io._triggerConnection(invalidSocket);
      }).not.toThrow();
    });

    it("continues to handle new connections after an error", async () => {
      // First connection fails
      const failedSocket = makeSocket("user1");
      (handlePresenceConnect as any).mockRejectedValueOnce(
        new Error("First failed"),
      );

      registerSocketHandlers(io);
      await io._triggerConnection(failedSocket);

      // Second connection succeeds
      const successSocket = makeSocket("user2");
      vi.clearAllMocks();
      (handlePresenceConnect as any).mockResolvedValueOnce([]);
      (PresenceService.getOnlineUsersFromList as any).mockReturnValue([]);

      // Re-register to test multiple connections to same listener
      const io2 = makeIO();
      registerSocketHandlers(io2);
      await io2._triggerConnection(successSocket);

      expect(successSocket.join).toHaveBeenCalledWith("user:user2");
      expect(handlePresenceConnect).toHaveBeenCalledWith(io2, successSocket);
    });
  });

  describe("data integrity and user context", () => {
    it("preserves user context across the connection lifecycle", async () => {
      const userId = "user123";
      const username = "alice";
      const userSocket = makeSocket(userId);
      userSocket.data.user.username = username;

      (handlePresenceConnect as any).mockResolvedValue([]);
      (PresenceService.getOnlineUsersFromList as any).mockReturnValue([]);

      registerSocketHandlers(io);
      await io._triggerConnection(userSocket);

      // Verify join used correct userId
      expect(userSocket.join).toHaveBeenCalledWith(`user:${userId}`);

      // Verify handler received socket with correct data
      expect(handlePresenceConnect).toHaveBeenCalledWith(
        io,
        expect.objectContaining({
          data: expect.objectContaining({
            user: expect.objectContaining({
              id: userId,
              username,
            }),
          }),
        }),
      );
    });

    it("passes correct io and socket instances to handlers", async () => {
      (handlePresenceConnect as any).mockResolvedValue([]);
      (PresenceService.getOnlineUsersFromList as any).mockReturnValue([]);

      registerSocketHandlers(io);
      await io._triggerConnection(socket);

      // Verify exact io and socket are passed
      expect(handlePresenceConnect).toHaveBeenCalledWith(io, socket);

      // When disconnect is triggered, same instances should be used
      vi.clearAllMocks();
      await socket._triggerDisconnect();

      expect(handlePresenceDisconnect).toHaveBeenCalledWith(io, socket);
    });
  });
});
