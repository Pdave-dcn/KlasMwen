import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { PresenceService } from "../../../src/socket/presence/presence.service.js";

describe("PresenceService", () => {
  // Since PresenceService uses a module-level Map, we need to clean up after each test
  // to avoid state pollution. We'll track all connected users and disconnect them.
  const connectedUsers: Map<string, Set<string>> = new Map();

  const track = (userId: string, socketId: string) => {
    if (!connectedUsers.has(userId)) {
      connectedUsers.set(userId, new Set());
    }
    connectedUsers.get(userId)!.add(socketId);
  };

  const cleanup = () => {
    for (const [userId, socketIds] of connectedUsers) {
      for (const socketId of socketIds) {
        PresenceService.userDisconnected(userId, socketId);
      }
    }
    connectedUsers.clear();
  };

  afterEach(() => {
    cleanup();
  });

  describe("userConnected", () => {
    it("returns true when a user connects for the first time", () => {
      const result = PresenceService.userConnected("user1", "socket1");
      track("user1", "socket1");

      expect(result).toBe(true);
      expect(PresenceService.isOnline("user1")).toBe(true);
    });

    it("returns false when the same user connects with a second socket (tab)", () => {
      PresenceService.userConnected("user1", "socket1");
      track("user1", "socket1");

      const result = PresenceService.userConnected("user1", "socket2");
      track("user1", "socket2");

      expect(result).toBe(false);
      expect(PresenceService.isOnline("user1")).toBe(true);
    });

    it("returns false when the same user connects with a third socket", () => {
      PresenceService.userConnected("user1", "socket1");
      track("user1", "socket1");
      PresenceService.userConnected("user1", "socket2");
      track("user1", "socket2");

      const result = PresenceService.userConnected("user1", "socket3");
      track("user1", "socket3");

      expect(result).toBe(false);
    });

    it("maintains online status immediately after first connection", () => {
      expect(PresenceService.isOnline("user1")).toBe(false);

      PresenceService.userConnected("user1", "socket1");
      track("user1", "socket1");

      expect(PresenceService.isOnline("user1")).toBe(true);
    });
  });

  describe("userDisconnected", () => {
    it("returns false when a user with multiple sockets disconnects one", () => {
      PresenceService.userConnected("user1", "socket1");
      track("user1", "socket1");
      PresenceService.userConnected("user1", "socket2");
      track("user1", "socket2");

      const result = PresenceService.userDisconnected("user1", "socket1");
      connectedUsers.get("user1")?.delete("socket1");

      expect(result).toBe(false);
      expect(PresenceService.isOnline("user1")).toBe(true); // still online via socket2
    });

    it("returns true when the last socket for a user is removed", () => {
      PresenceService.userConnected("user1", "socket1");
      track("user1", "socket1");

      const result = PresenceService.userDisconnected("user1", "socket1");
      connectedUsers.get("user1")?.delete("socket1");

      expect(result).toBe(true);
      expect(PresenceService.isOnline("user1")).toBe(false);
    });

    it("returns true only on the final disconnect when user had multiple sockets", () => {
      PresenceService.userConnected("user1", "socket1");
      track("user1", "socket1");
      PresenceService.userConnected("user1", "socket2");
      track("user1", "socket2");
      PresenceService.userConnected("user1", "socket3");
      track("user1", "socket3");

      // disconnect first two should return false
      expect(PresenceService.userDisconnected("user1", "socket1")).toBe(false);
      connectedUsers.get("user1")?.delete("socket1");
      expect(PresenceService.userDisconnected("user1", "socket2")).toBe(false);
      connectedUsers.get("user1")?.delete("socket2");

      // last disconnect should return true
      const finalResult = PresenceService.userDisconnected("user1", "socket3");
      connectedUsers.get("user1")?.delete("socket3");

      expect(finalResult).toBe(true);
      expect(PresenceService.isOnline("user1")).toBe(false);
    });

    it("returns false gracefully when disconnecting a non-existent user", () => {
      const result = PresenceService.userDisconnected("nonexistent", "socket1");

      expect(result).toBe(false);
    });

    it("returns false when disconnecting a non-existent socket for an existing user", () => {
      PresenceService.userConnected("user1", "socket1");
      track("user1", "socket1");

      const result = PresenceService.userDisconnected(
        "user1",
        "nonexistent-socket",
      );

      expect(result).toBe(false);
      expect(PresenceService.isOnline("user1")).toBe(true); // user still online
    });
  });

  describe("isOnline", () => {
    it("returns false for a userId with no sockets", () => {
      expect(PresenceService.isOnline("user1")).toBe(false);
    });

    it("returns true when a user has one socket", () => {
      PresenceService.userConnected("user1", "socket1");
      track("user1", "socket1");

      expect(PresenceService.isOnline("user1")).toBe(true);
    });

    it("returns true when a user has multiple sockets", () => {
      PresenceService.userConnected("user1", "socket1");
      track("user1", "socket1");
      PresenceService.userConnected("user1", "socket2");
      track("user1", "socket2");

      expect(PresenceService.isOnline("user1")).toBe(true);
    });

    it("returns false after all sockets are disconnected", () => {
      PresenceService.userConnected("user1", "socket1");
      track("user1", "socket1");
      PresenceService.userConnected("user1", "socket2");
      track("user1", "socket2");

      PresenceService.userDisconnected("user1", "socket1");
      connectedUsers.get("user1")?.delete("socket1");
      PresenceService.userDisconnected("user1", "socket2");
      connectedUsers.get("user1")?.delete("socket2");

      expect(PresenceService.isOnline("user1")).toBe(false);
    });
  });

  describe("getOnlineUsersFromList", () => {
    it("returns only online users from a mixed list", () => {
      PresenceService.userConnected("user1", "socket1");
      track("user1", "socket1");
      PresenceService.userConnected("user2", "socket2");
      track("user2", "socket2");
      // user3 is not connected

      const result = PresenceService.getOnlineUsersFromList([
        "user1",
        "user2",
        "user3",
      ]);

      expect(result).toEqual(expect.arrayContaining(["user1", "user2"]));
      expect(result).not.toContain("user3");
      expect(result).toHaveLength(2);
    });

    it("returns empty array when no users are online", () => {
      const result = PresenceService.getOnlineUsersFromList([
        "user1",
        "user2",
        "user3",
      ]);

      expect(result).toEqual([]);
    });

    it("returns all users when all are online", () => {
      PresenceService.userConnected("user1", "socket1");
      track("user1", "socket1");
      PresenceService.userConnected("user2", "socket2");
      track("user2", "socket2");
      PresenceService.userConnected("user3", "socket3");
      track("user3", "socket3");

      const result = PresenceService.getOnlineUsersFromList([
        "user1",
        "user2",
        "user3",
      ]);

      expect(result).toEqual(
        expect.arrayContaining(["user1", "user2", "user3"]),
      );
      expect(result).toHaveLength(3);
    });

    it("correctly filters duplicate IDs in the input list", () => {
      PresenceService.userConnected("user1", "socket1");
      track("user1", "socket1");

      const result = PresenceService.getOnlineUsersFromList([
        "user1",
        "user1",
        "user2",
      ]);

      expect(result).toContain("user1");
      expect(result).not.toContain("user2");
    });
  });

  describe("edge cases and state isolation", () => {
    it("handles rapid connect/disconnect cycles", () => {
      for (let i = 0; i < 5; i++) {
        const connected = PresenceService.userConnected("user1", `sock${i}`);
        track("user1", `sock${i}`);
        expect(connected).toBe(i === 0); // first should be true, rest false
      }

      expect(PresenceService.isOnline("user1")).toBe(true);

      for (let i = 0; i < 5; i++) {
        const disconnected = PresenceService.userDisconnected(
          "user1",
          `sock${i}`,
        );
        connectedUsers.get("user1")?.delete(`sock${i}`);
        expect(disconnected).toBe(i === 4); // last should be true, rest false
      }

      expect(PresenceService.isOnline("user1")).toBe(false);
    });

    it("isolates state between multiple users", () => {
      PresenceService.userConnected("user1", "socket1");
      track("user1", "socket1");
      PresenceService.userConnected("user2", "socket1"); // same socket id, different user
      track("user2", "socket1");

      expect(PresenceService.isOnline("user1")).toBe(true);
      expect(PresenceService.isOnline("user2")).toBe(true);

      PresenceService.userDisconnected("user1", "socket1");
      connectedUsers.get("user1")?.delete("socket1");

      expect(PresenceService.isOnline("user1")).toBe(false);
      expect(PresenceService.isOnline("user2")).toBe(true); // unaffected
    });
  });
});
