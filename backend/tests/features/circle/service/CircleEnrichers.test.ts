import { describe, it, expect, beforeEach, vi } from "vitest";
import CircleEnricher from "../../../../src/features/circle/service/CircleEnrichers.js";
import CircleRepository from "../../../../src/features/circle/service/Repositories/CircleRepository.js";
import CircleTransformers from "../../../../src/features/circle/service/CircleTransformers.js";

vi.mock("../../../../src/features/circle/service/Repositories/CircleRepository.js");
vi.mock("../../../../src/features/circle/service/CircleTransformers.js");

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
        members: [{ lastReadAt: new Date("2025-01-01") }],
        _count: { members: 5 },
      } as any;

      const membership = { userId: "u2", role: "MEMBER" };
      const message = { id: 1, content: "hello", createdAt: new Date() };
      const transformed = { id: 1, content: "hello", createdAt: "2025-01-01" };

      vi.mocked(CircleRepository.getMembership).mockResolvedValue(membership as any);
      vi.mocked(CircleRepository.getLatestMessage).mockResolvedValue(message as any);
      vi.mocked(CircleRepository.countUnreadMessages).mockResolvedValue(3);
      vi.mocked(CircleTransformers.transformMessage).mockReturnValue(transformed as any);

      const result = await CircleEnricher.enrichCircle(circle, "u2");

      expect(result.memberCount).toBe(5);
      expect(result.userRole).toBe("MEMBER");
      expect(result.latestMessage).toEqual(transformed);
      expect(result.unreadCount).toBe(3);
      expect(result).not.toHaveProperty("_count");
      expect(result).not.toHaveProperty("members");
    });

    it("should enrich circle without role when userId not provided", async () => {
      const circle = {
        id: "c1",
        name: "Test",
        description: "desc",
        isPrivate: false,
        createdAt: new Date(),
        creator: { id: "u1", username: "Creator" },
        avatar: { url: "http://example.com/avatar.png" },
        members: [{ lastReadAt: null }],
        _count: { members: 2 },
      } as any;

      const message = { id: 1, content: "msg" };
      const transformed = { id: 1, content: "msg" };

      vi.mocked(CircleRepository.getLatestMessage).mockResolvedValue(message as any);
      vi.mocked(CircleRepository.countUnreadMessages).mockResolvedValue(0);
      vi.mocked(CircleTransformers.transformMessage).mockReturnValue(transformed as any);

      const result = await CircleEnricher.enrichCircle(circle);

      expect(result.userRole).toBeNull();
      expect(CircleRepository.getMembership).not.toHaveBeenCalled();
    });

    it("should set userRole to null when membership not found", async () => {
      const circle = {
        id: "c1",
        name: "Test",
        description: "desc",
        isPrivate: false,
        createdAt: new Date(),
        creator: { id: "u1", username: "Creator" },
        avatar: { url: "http://example.com/avatar.png" },
        members: [{ lastReadAt: null }],
        _count: { members: 1 },
      } as any;

      vi.mocked(CircleRepository.getMembership).mockResolvedValue(null);
      vi.mocked(CircleRepository.getLatestMessage).mockResolvedValue(null);
      vi.mocked(CircleRepository.countUnreadMessages).mockResolvedValue(0);

      const result = await CircleEnricher.enrichCircle(circle, "u2");

      expect(result.userRole).toBeNull();
      expect(result.latestMessage).toBeNull();
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
        members: [{ lastReadAt: null }],
        _count: { members: 1 },
      } as any;

      vi.mocked(CircleRepository.getLatestMessage).mockResolvedValue(null);
      vi.mocked(CircleRepository.countUnreadMessages).mockResolvedValue(5);

      const result = await CircleEnricher.enrichCircle(circle);

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
          members: [{ lastReadAt: null }],
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
          members: [{ lastReadAt: null }],
          _count: { members: 3 },
        },
      ] as any;

      vi.mocked(CircleRepository.getMembership).mockResolvedValue({ role: "MEMBER" } as any);
      vi.mocked(CircleRepository.getLatestMessage).mockResolvedValue(null);
      vi.mocked(CircleRepository.countUnreadMessages).mockResolvedValue(0);

      const result = await CircleEnricher.enrichCircles(circles, "u");

      expect(result).toHaveLength(2);
      expect(result[0].memberCount).toBe(2);
      expect(result[1].memberCount).toBe(3);
      expect(result[0].userRole).toBe("MEMBER");
    });

    it("should enrich empty list", async () => {
      const result = await CircleEnricher.enrichCircles([]);
      expect(result).toEqual([]);
    });
  });

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
