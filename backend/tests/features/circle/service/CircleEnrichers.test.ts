import { describe, it, expect, beforeEach, vi } from "vitest";
import CircleEnricher from "../../../../src/features/circle/service/CircleEnrichers.js";
import CircleRepository from "../../../../src/features/circle/service/Repositories/CircleRepository.js";

vi.mock(
  "../../../../src/features/circle/service/Repositories/CircleRepository.js",
);

describe("CircleEnricher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("enrichCircle", () => {
    it("should enrich circle with role when userId provided", async () => {
      const circle = {
        id: "c1",
        name: "Test",
        description: "desc",
        isPrivate: false,
        createdAt: new Date(),
        creator: { id: "u1", username: "Creator" },
        avatar: { url: "http://example.com/avatar.png" },
        members: [
          { userId: "u2", role: "MEMBER", lastReadAt: new Date("2025-01-01") },
        ],
        messages: [
          {
            id: 1,
            content: "hello",
            createdAt: new Date(),
            sender: { id: "u1", username: "Creator" },
          },
        ],
        _count: { members: 5 },
      } as any;

      vi.mocked(CircleRepository.countUnreadMessages).mockResolvedValue(3);

      const result = await CircleEnricher.enrichCircle(circle, "u2");

      expect(result.memberCount).toBe(5);
      expect(result.userRole).toBe("MEMBER");
      expect(result.latestMessage).toEqual(circle.messages[0]);
      expect(result.unreadCount).toBe(3);
      expect(result).not.toHaveProperty("_count");
      expect(result).not.toHaveProperty("members");
    });

    it("should handle no latest message", async () => {
      const circle = {
        id: "c1",
        name: "Test",
        description: "desc",
        isPrivate: false,
        createdAt: new Date(),
        creator: { id: "u1", username: "Creator" },
        avatar: { url: "http://example.com/avatar.png" },
        members: [{ userId: "u1", role: "OWNER", lastReadAt: null }],
        messages: [], // empty messages array
        _count: { members: 1 },
      } as any;

      vi.mocked(CircleRepository.countUnreadMessages).mockResolvedValue(5);

      const result = await CircleEnricher.enrichCircle(circle, "u1");

      expect(result.latestMessage).toBeNull();
      expect(result.unreadCount).toBe(5);
    });
  });

  describe("enrichCircles", () => {
    it("should enrich multiple circles", async () => {
      const circles = [
        {
          id: "c1",
          name: "Circle1",
          description: "desc",
          isPrivate: false,
          createdAt: new Date(),
          creator: { id: "u1", username: "C1" },
          avatar: { url: "url1" },
          members: [{ userId: "u1", role: "MEMBER", lastReadAt: null }],
          messages: [],
          _count: { members: 2 },
        },
        {
          id: "c2",
          name: "Circle2",
          description: "desc",
          isPrivate: false,
          createdAt: new Date(),
          creator: { id: "u1", username: "C2" },
          avatar: { url: "url2" },
          members: [{ userId: "u1", role: "OWNER", lastReadAt: null }],
          messages: [],
          _count: { members: 3 },
        },
      ] as any;

      vi.mocked(CircleRepository.countUnreadMessagesBatch).mockResolvedValue({
        c1: 0,
        c2: 2,
      });

      const result = await CircleEnricher.enrichCircles(circles, "u1");

      expect(result).toHaveLength(2);
      expect(result[0].memberCount).toBe(2);
      expect(result[1].memberCount).toBe(3);
      expect(result[0].userRole).toBe("MEMBER");
      expect(result[1].userRole).toBe("OWNER");
      expect(result[0].unreadCount).toBe(0);
      expect(result[1].unreadCount).toBe(2);
      expect(CircleRepository.getMembership).not.toHaveBeenCalled();
      expect(CircleRepository.getLatestMessage).not.toHaveBeenCalled();
    });

    it("should enrich empty list", async () => {
      vi.mocked(CircleRepository.countUnreadMessagesBatch).mockResolvedValue(
        {},
      );

      const result = await CircleEnricher.enrichCircles([], "u1");
      expect(result).toEqual([]);
    });
  });

  // enrichMember and enrichMembers tests are unchanged - no fixes needed
  describe("enrichMember", () => {
    it("should set isMuted to true when mutedUntil is in future", () => {
      const future = new Date(Date.now() + 3600000);
      const member = {
        userId: "u1",
        role: "MEMBER",
        joinedAt: new Date(),
        mutedUntil: future,
        user: { id: "u1", username: "User", Avatar: null },
      } as any;

      const result = CircleEnricher.enrichMember(member);

      expect(result.isMuted).toBe(true);
      expect(result).not.toHaveProperty("mutedUntil");
      expect(result.userId).toBe("u1");
      expect(result.role).toBe("MEMBER");
    });

    it("should set isMuted to false when mutedUntil is in past", () => {
      const past = new Date(Date.now() - 3600000);
      const member = {
        userId: "u1",
        role: "MEMBER",
        joinedAt: new Date(),
        mutedUntil: past,
        user: { id: "u1", username: "User", Avatar: null },
      } as any;

      const result = CircleEnricher.enrichMember(member);

      expect(result.isMuted).toBe(false);
    });

    it("should set isMuted to false when mutedUntil is null", () => {
      const member = {
        userId: "u1",
        role: "MEMBER",
        joinedAt: new Date(),
        mutedUntil: null,
        user: { id: "u1", username: "User", Avatar: null },
      } as any;

      const result = CircleEnricher.enrichMember(member);

      expect(result.isMuted).toBe(false);
    });
  });

  describe("enrichMembers", () => {
    it("should enrich multiple members", () => {
      const now = new Date();
      const future = new Date(Date.now() + 3600000);

      const members = [
        {
          userId: "u1",
          role: "MEMBER",
          joinedAt: now,
          mutedUntil: null,
          user: { id: "u1", username: "User1", Avatar: null },
        },
        {
          userId: "u2",
          role: "MODERATOR",
          joinedAt: now,
          mutedUntil: future,
          user: { id: "u2", username: "User2", Avatar: null },
        },
      ] as any;

      const result = CircleEnricher.enrichMembers(members);

      expect(result).toHaveLength(2);
      expect(result[0].isMuted).toBe(false);
      expect(result[1].isMuted).toBe(true);
      expect(result[0].role).toBe("MEMBER");
      expect(result[1].role).toBe("MODERATOR");
    });

    it("should handle empty members array", () => {
      const result = CircleEnricher.enrichMembers([]);
      expect(result).toEqual([]);
    });
  });
});
