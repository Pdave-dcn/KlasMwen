import { describe, it, expect } from "vitest";
import CircleTransformers from "../../../../src/features/circle/service/CircleTransformers.js";

describe("CircleTransformers", () => {
  describe("transformMember", () => {
    it("should transform Avatar to avatar in user object", () => {
      const member = {
        userId: "u1",
        role: "MEMBER",
        joinedAt: new Date(),
        isMuted: false,
        user: {
          id: "u1",
          username: "john",
          Avatar: { url: "http://example.com/avatar.png" },
        },
      } as any;

      const result = CircleTransformers.transformMember(member);

      expect(result.user.avatar).toEqual({
        url: "http://example.com/avatar.png",
      });
      expect(result.user).not.toHaveProperty("Avatar");
      expect(result.userId).toBe("u1");
      expect(result.role).toBe("MEMBER");
    });

    it("should handle null Avatar", () => {
      const member = {
        userId: "u1",
        role: "MEMBER",
        joinedAt: new Date(),
        isMuted: false,
        user: {
          id: "u1",
          username: "john",
          Avatar: null,
        },
      } as any;

      const result = CircleTransformers.transformMember(member);

      expect(result.user.avatar).toBeNull();
      expect(result.user).not.toHaveProperty("Avatar");
    });

    it("should preserve other member properties", () => {
      const now = new Date();
      const member = {
        userId: "u1",
        role: "MODERATOR",
        joinedAt: now,
        isMuted: true,
        user: {
          id: "u1",
          username: "admin",
          Avatar: null,
        },
      } as any;

      const result = CircleTransformers.transformMember(member);

      expect(result.role).toBe("MODERATOR");
      expect(result.joinedAt).toBe(now);
      expect(result.isMuted).toBe(true);
    });
  });

  describe("transformMembers", () => {
    it("should transform multiple members", () => {
      const members = [
        {
          userId: "u1",
          role: "MEMBER",
          joinedAt: new Date(),
          isMuted: false,
          user: {
            id: "u1",
            username: "john",
            Avatar: { url: "url1" },
          },
        },
        {
          userId: "u2",
          role: "MODERATOR",
          joinedAt: new Date(),
          isMuted: true,
          user: {
            id: "u2",
            username: "jane",
            Avatar: null,
          },
        },
      ] as any;

      const result = CircleTransformers.transformMembers(members);

      expect(result).toHaveLength(2);
      expect(result[0].user.avatar).toEqual({ url: "url1" });
      expect(result[1].user.avatar).toBeNull();
    });

    it("should handle empty array", () => {
      const result = CircleTransformers.transformMembers([]);
      expect(result).toEqual([]);
    });
  });

  describe("transformMessage", () => {
    it("should transform Avatar to avatar in sender object", () => {
      const message = {
        id: 1,
        content: "hello",
        circleId: "c1",
        createdAt: new Date(),
        sender: {
          id: "u1",
          username: "john",
          Avatar: { url: "http://example.com/avatar.png" },
        },
      } as any;

      const result = CircleTransformers.transformMessage(message);

      expect(result.sender.avatar).toEqual({
        url: "http://example.com/avatar.png",
      });
      expect(result.sender).not.toHaveProperty("Avatar");
      expect(result.id).toBe(1);
      expect(result.content).toBe("hello");
    });

    it("should handle null Avatar in sender", () => {
      const message = {
        id: 1,
        content: "hello",
        circleId: "c1",
        createdAt: new Date(),
        sender: {
          id: "u1",
          username: "john",
          Avatar: null,
        },
      } as any;

      const result = CircleTransformers.transformMessage(message);

      expect(result.sender.avatar).toBeNull();
      expect(result.sender).not.toHaveProperty("Avatar");
    });

    it("should preserve message properties", () => {
      const now = new Date();
      const message = {
        id: 42,
        content: "test message",
        circleId: "c1",
        createdAt: now,
        sender: {
          id: "u1",
          username: "john",
          Avatar: null,
        },
      } as any;

      const result = CircleTransformers.transformMessage(message);

      expect(result.id).toBe(42);
      expect(result.content).toBe("test message");
      expect(result.circleId).toBe("c1");
      expect(result.createdAt).toBe(now);
    });
  });

  describe("transformMessages", () => {
    it("should transform multiple messages", () => {
      const messages = [
        {
          id: 1,
          content: "msg1",
          circleId: "c1",
          createdAt: new Date(),
          sender: {
            id: "u1",
            username: "john",
            Avatar: { url: "url1" },
          },
        },
        {
          id: 2,
          content: "msg2",
          circleId: "c1",
          createdAt: new Date(),
          sender: {
            id: "u2",
            username: "jane",
            Avatar: null,
          },
        },
      ] as any;

      const result = CircleTransformers.transformMessages(messages);

      expect(result).toHaveLength(2);
      expect(result[0].sender.avatar).toEqual({ url: "url1" });
      expect(result[1].sender.avatar).toBeNull();
    });

    it("should handle empty array", () => {
      const result = CircleTransformers.transformMessages([]);
      expect(result).toEqual([]);
    });
  });

  describe("transformCircleForDiscovery", () => {
    it("should transform circle with member count and tags", () => {
      const circle = {
        id: "c1",
        name: "Test Circle",
        description: "desc",
        isPrivate: false,
        avatar: { url: "avatar_url" },
        circleTags: [
          { tag: { id: 1, name: "python" } },
          { tag: { id: 2, name: "study" } },
        ],
        _count: { members: 5 },
      } as any;

      const result = CircleTransformers.transformCircleForDiscovery(circle);

      expect(result.memberCount).toBe(5);
      expect(result.tags).toHaveLength(2);
      expect(result.tags[0]).toEqual({ id: 1, name: "python" });
      expect(result.tags[1]).toEqual({ id: 2, name: "study" });
      expect(result).not.toHaveProperty("_count");
      expect(result).not.toHaveProperty("circleTags");
    });

    it("should handle empty tags", () => {
      const circle = {
        id: "c1",
        name: "Test",
        description: "desc",
        isPrivate: false,
        avatar: { url: "url" },
        circleTags: [],
        _count: { members: 1 },
      } as any;

      const result = CircleTransformers.transformCircleForDiscovery(circle);

      expect(result.tags).toEqual([]);
      expect(result.memberCount).toBe(1);
    });
  });

  describe("transformCirclesForDiscovery", () => {
    it("should transform multiple circles", () => {
      const circles = [
        {
          id: "c1",
          name: "Circle1",
          description: "d1",
          isPrivate: false,
          avatar: { url: "url1" },
          circleTags: [{ tag: { id: 1, name: "tag1" } }],
          _count: { members: 5 },
        },
        {
          id: "c2",
          name: "Circle2",
          description: "d2",
          isPrivate: true,
          avatar: { url: "url2" },
          circleTags: [],
          _count: { members: 10 },
        },
      ] as any;

      const result = CircleTransformers.transformCirclesForDiscovery(circles);

      expect(result).toHaveLength(2);
      expect(result[0].memberCount).toBe(5);
      expect(result[1].memberCount).toBe(10);
      expect(result[0].tags).toHaveLength(1);
      expect(result[1].tags).toHaveLength(0);
    });

    it("should handle empty array", () => {
      const result = CircleTransformers.transformCirclesForDiscovery([]);
      expect(result).toEqual([]);
    });
  });

  describe("transformCircleForSuggestion", () => {
    it("should transform suggestion with member count", () => {
      const circle = {
        id: "c1",
        name: "Test Circle",
        _count: { members: 15 },
      } as any;

      const result = CircleTransformers.transformCircleForSuggestion(circle);

      expect(result.memberCount).toBe(15);
      expect(result.id).toBe("c1");
      expect(result.name).toBe("Test Circle");
      expect(result).not.toHaveProperty("_count");
    });
  });

  describe("transformCirclesForSuggestion", () => {
    it("should transform multiple suggestions", () => {
      const circles = [
        { id: "c1", name: "Circle1", _count: { members: 5 } },
        { id: "c2", name: "Circle2", _count: { members: 10 } },
      ] as any;

      const result = CircleTransformers.transformCirclesForSuggestion(circles);

      expect(result).toHaveLength(2);
      expect(result[0].memberCount).toBe(5);
      expect(result[1].memberCount).toBe(10);
    });

    it("should handle empty array", () => {
      const result = CircleTransformers.transformCirclesForSuggestion([]);
      expect(result).toEqual([]);
    });
  });

  describe("transformCircleForDetailPage", () => {
    it("should transform detail circle with all fields", () => {
      const date = new Date();
      const circle = {
        id: "c1",
        name: "Test Circle",
        description: "desc",
        avatar: { url: "avatar_url" },
        isPrivate: false,
        createdAt: date,
        creator: {
          id: "u1",
          username: "creator",
          Avatar: { url: "creator_avatar" },
        },
        messages: [{ createdAt: date }],
        circleTags: [
          { tag: { id: 1, name: "python" } },
          { tag: { id: 2, name: "study" } },
        ],
        _count: { members: 20 },
      } as any;

      const result = CircleTransformers.transformCircleForDetailPage(circle);

      expect(result.memberCount).toBe(20);
      expect(result.creator.avatar).toEqual({ url: "creator_avatar" });
      expect(result.creator).not.toHaveProperty("Avatar");
      expect(result.lastActivityAt).toBe(date);
      expect(result.tags).toHaveLength(2);
      expect(result.tags[0]).toEqual({ id: 1, name: "python" });
      expect(result).not.toHaveProperty("_count");
      expect(result).not.toHaveProperty("circleTags");
      expect(result).not.toHaveProperty("messages");
    });

    it("should handle null creator avatar", () => {
      const date = new Date();
      const circle = {
        id: "c1",
        name: "Test",
        description: "desc",
        avatar: { url: "url" },
        isPrivate: false,
        createdAt: date,
        creator: {
          id: "u1",
          username: "creator",
          Avatar: null,
        },
        messages: [{ createdAt: date }],
        circleTags: [],
        _count: { members: 1 },
      } as any;

      const result = CircleTransformers.transformCircleForDetailPage(circle);

      expect(result.creator.avatar).toBeNull();
      expect(result.creator).not.toHaveProperty("Avatar");
    });

    it("should handle empty tags and preserve basic info", () => {
      const date = new Date();
      const circle = {
        id: "c1",
        name: "Basic Circle",
        description: "basic desc",
        avatar: { url: "url" },
        isPrivate: true,
        createdAt: date,
        creator: {
          id: "u1",
          username: "creator",
          Avatar: null,
        },
        messages: [{ createdAt: date }],
        circleTags: [],
        _count: { members: 3 },
      } as any;

      const result = CircleTransformers.transformCircleForDetailPage(circle);

      expect(result.name).toBe("Basic Circle");
      expect(result.isPrivate).toBe(true);
      expect(result.createdAt).toBe(date);
      expect(result.tags).toEqual([]);
    });
  });
});
