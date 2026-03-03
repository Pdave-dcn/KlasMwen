import { describe, it, expect, beforeEach, vi } from "vitest";
import { hasCirclePermission } from "../../../../src/features/circle/security/rbac.js";
import type { CircleRole } from "@prisma/client";

describe("hasCirclePermission", () => {
  // Helper to create mock users
  const createUser = (id: string, circleRole?: CircleRole) => ({
    id,
    username: "TestUser",
    role: "STUDENT",
    circleRole,
  });

  // Helper to create mock circle data
  const createCircle = (id: string, creatorId: string) => ({
    id,
    creatorId,
    name: "Test Circle",
  });

  // Helper to create mock member data
  const createMember = (userId: string, role: CircleRole) => ({
    userId,
    role,
  });

  // Helper to create mock message data
  const createMessage = (id: number, senderId: string, circleId: string) => ({
    id,
    senderId,
    circleId,
    content: "Test message",
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("permission checks without user circleRole", () => {
    it("should return false when user has no circleRole", () => {
      const user = createUser("user-1");
      const result = hasCirclePermission(user, "circles", "read");
      expect(result).toBe(false);
    });

    it("should return false for any resource when circleRole is undefined", () => {
      const user = createUser("user-1", undefined);
      expect(hasCirclePermission(user, "circles", "create")).toBe(false);
      expect(hasCirclePermission(user, "circleMessages", "send")).toBe(false);
      expect(hasCirclePermission(user, "circleMembers", "view")).toBe(false);
    });
  });

  describe("OWNER role - circles resource", () => {
    it("should allow OWNER to create circles", () => {
      const user = createUser("owner-1", "OWNER");
      const result = hasCirclePermission(user, "circles", "create");
      expect(result).toBe(true);
    });

    it("should allow OWNER to read circles", () => {
      const user = createUser("owner-1", "OWNER");
      const result = hasCirclePermission(user, "circles", "read");
      expect(result).toBe(true);
    });

    it("should allow OWNER to update circles", () => {
      const user = createUser("owner-1", "OWNER");
      const result = hasCirclePermission(user, "circles", "update");
      expect(result).toBe(true);
    });

    it("should allow OWNER to delete circles", () => {
      const user = createUser("owner-1", "OWNER");
      const result = hasCirclePermission(user, "circles", "delete");
      expect(result).toBe(true);
    });

    it("should not allow OWNER to join circles", () => {
      const user = createUser("owner-1", "OWNER");
      const result = hasCirclePermission(user, "circles", "join");
      expect(result).toBe(false);
    });

    it("should allow OWNER to invite members", () => {
      const user = createUser("owner-1", "OWNER");
      const result = hasCirclePermission(user, "circles", "invite");
      expect(result).toBe(true);
    });
  });

  describe("OWNER role - circleMembers resource", () => {
    it("should allow OWNER to add members", () => {
      const user = createUser("owner-1", "OWNER");
      const result = hasCirclePermission(user, "circleMembers", "add");
      expect(result).toBe(true);
    });

    it("should allow OWNER to view members", () => {
      const user = createUser("owner-1", "OWNER");
      const result = hasCirclePermission(user, "circleMembers", "view");
      expect(result).toBe(true);
    });

    it("should not allow OWNER to remove other owners", () => {
      const user = createUser("owner-1", "OWNER");
      const targetMember = createMember("owner-2", "OWNER");
      const result = hasCirclePermission(
        user,
        "circleMembers",
        "remove",
        targetMember,
      );
      expect(result).toBe(false);
    });

    it("should allow OWNER to remove moderators", () => {
      const user = createUser("owner-1", "OWNER");
      const targetMember = createMember("mod-1", "MODERATOR");
      const result = hasCirclePermission(
        user,
        "circleMembers",
        "remove",
        targetMember,
      );
      expect(result).toBe(true);
    });

    it("should allow OWNER to remove members", () => {
      const user = createUser("owner-1", "OWNER");
      const targetMember = createMember("member-1", "MEMBER");
      const result = hasCirclePermission(
        user,
        "circleMembers",
        "remove",
        targetMember,
      );
      expect(result).toBe(true);
    });

    it("should not allow OWNER to update other owners' roles", () => {
      const user = createUser("owner-1", "OWNER");
      const targetMember = createMember("owner-2", "OWNER");
      const result = hasCirclePermission(
        user,
        "circleMembers",
        "updateRole",
        targetMember,
      );
      expect(result).toBe(false);
    });

    it("should allow OWNER to update moderators' roles", () => {
      const user = createUser("owner-1", "OWNER");
      const targetMember = createMember("mod-1", "MODERATOR");
      const result = hasCirclePermission(
        user,
        "circleMembers",
        "updateRole",
        targetMember,
      );
      expect(result).toBe(true);
    });
  });

  describe("OWNER role - circleMessages resource", () => {
    it("should allow OWNER to send messages", () => {
      const user = createUser("owner-1", "OWNER");
      const result = hasCirclePermission(user, "circleMessages", "send");
      expect(result).toBe(true);
    });

    it("should allow OWNER to read messages", () => {
      const user = createUser("owner-1", "OWNER");
      const result = hasCirclePermission(user, "circleMessages", "read");
      expect(result).toBe(true);
    });

    it("should allow OWNER to delete any message", () => {
      const user = createUser("owner-1", "OWNER");
      const message = createMessage(1, "member-1", "circle-1");
      const result = hasCirclePermission(
        user,
        "circleMessages",
        "delete",
        message,
      );
      expect(result).toBe(true);
    });
  });

  describe("MODERATOR role - circles resource", () => {
    it("should allow MODERATOR to create circles", () => {
      const user = createUser("mod-1", "MODERATOR");
      const result = hasCirclePermission(user, "circles", "create");
      expect(result).toBe(true);
    });

    it("should allow MODERATOR to read circles", () => {
      const user = createUser("mod-1", "MODERATOR");
      const result = hasCirclePermission(user, "circles", "read");
      expect(result).toBe(true);
    });

    it("should allow MODERATOR to update circles", () => {
      const user = createUser("mod-1", "MODERATOR");
      const result = hasCirclePermission(user, "circles", "update");
      expect(result).toBe(true);
    });

    it("should not allow MODERATOR to delete circles", () => {
      const user = createUser("mod-1", "MODERATOR");
      const result = hasCirclePermission(user, "circles", "delete");
      expect(result).toBe(false);
    });

    it("should allow MODERATOR to invite members", () => {
      const user = createUser("mod-1", "MODERATOR");
      const result = hasCirclePermission(user, "circles", "invite");
      expect(result).toBe(true);
    });
  });

  describe("MODERATOR role - circleMembers resource", () => {
    it("should allow MODERATOR to add members", () => {
      const user = createUser("mod-1", "MODERATOR");
      const result = hasCirclePermission(user, "circleMembers", "add");
      expect(result).toBe(true);
    });

    it("should not allow MODERATOR to remove owners", () => {
      const user = createUser("mod-1", "MODERATOR");
      const targetMember = createMember("owner-1", "OWNER");
      const result = hasCirclePermission(
        user,
        "circleMembers",
        "remove",
        targetMember,
      );
      expect(result).toBe(false);
    });

    it("should not allow MODERATOR to remove other moderators", () => {
      const user = createUser("mod-1", "MODERATOR");
      const targetMember = createMember("mod-2", "MODERATOR");
      const result = hasCirclePermission(
        user,
        "circleMembers",
        "remove",
        targetMember,
      );
      expect(result).toBe(false);
    });

    it("should allow MODERATOR to remove members", () => {
      const user = createUser("mod-1", "MODERATOR");
      const targetMember = createMember("member-1", "MEMBER");
      const result = hasCirclePermission(
        user,
        "circleMembers",
        "remove",
        targetMember,
      );
      expect(result).toBe(true);
    });

    it("should not allow MODERATOR to update roles", () => {
      const user = createUser("mod-1", "MODERATOR");
      const targetMember = createMember("member-1", "MEMBER");
      const result = hasCirclePermission(
        user,
        "circleMembers",
        "updateRole",
        targetMember,
      );
      expect(result).toBe(false);
    });

    it("should allow MODERATOR to view members", () => {
      const user = createUser("mod-1", "MODERATOR");
      const result = hasCirclePermission(user, "circleMembers", "view");
      expect(result).toBe(true);
    });
  });

  describe("MODERATOR role - circleMessages resource", () => {
    it("should allow MODERATOR to send messages", () => {
      const user = createUser("mod-1", "MODERATOR");
      const result = hasCirclePermission(user, "circleMessages", "send");
      expect(result).toBe(true);
    });

    it("should allow MODERATOR to read messages", () => {
      const user = createUser("mod-1", "MODERATOR");
      const result = hasCirclePermission(user, "circleMessages", "read");
      expect(result).toBe(true);
    });

    it("should allow MODERATOR to delete any message", () => {
      const user = createUser("mod-1", "MODERATOR");
      const message = createMessage(1, "member-1", "circle-1");
      const result = hasCirclePermission(
        user,
        "circleMessages",
        "delete",
        message,
      );
      expect(result).toBe(true);
    });
  });

  describe("MEMBER role - circles resource", () => {
    it("should allow MEMBER to create circles", () => {
      const user = createUser("member-1", "MEMBER");
      const result = hasCirclePermission(user, "circles", "create");
      expect(result).toBe(true);
    });

    it("should allow MEMBER to read circles", () => {
      const user = createUser("member-1", "MEMBER");
      const result = hasCirclePermission(user, "circles", "read");
      expect(result).toBe(true);
    });

    it("should not allow MEMBER to update circles", () => {
      const user = createUser("member-1", "MEMBER");
      const result = hasCirclePermission(user, "circles", "update");
      expect(result).toBe(false);
    });

    it("should not allow MEMBER to delete circles", () => {
      const user = createUser("member-1", "MEMBER");
      const result = hasCirclePermission(user, "circles", "delete");
      expect(result).toBe(false);
    });

    it("should allow MEMBER to join circles", () => {
      const user = createUser("member-1", "MEMBER");
      const result = hasCirclePermission(user, "circles", "join");
      expect(result).toBe(true);
    });

    it("should not allow MEMBER to invite others", () => {
      const user = createUser("member-1", "MEMBER");
      const result = hasCirclePermission(user, "circles", "invite");
      expect(result).toBe(false);
    });
  });

  describe("MEMBER role - circleMembers resource", () => {
    it("should not allow MEMBER to add members", () => {
      const user = createUser("member-1", "MEMBER");
      const result = hasCirclePermission(user, "circleMembers", "add");
      expect(result).toBe(false);
    });

    it("should allow MEMBER to remove themselves (isMemberUser)", () => {
      const user = createUser("member-1", "MEMBER");
      const targetMember = createMember("member-1", "MEMBER");
      const result = hasCirclePermission(
        user,
        "circleMembers",
        "remove",
        targetMember,
      );
      expect(result).toBe(true);
    });

    it("should not allow MEMBER to remove other members", () => {
      const user = createUser("member-1", "MEMBER");
      const targetMember = createMember("member-2", "MEMBER");
      const result = hasCirclePermission(
        user,
        "circleMembers",
        "remove",
        targetMember,
      );
      expect(result).toBe(false);
    });

    it("should not allow MEMBER to update roles", () => {
      const user = createUser("member-1", "MEMBER");
      const targetMember = createMember("member-2", "MEMBER");
      const result = hasCirclePermission(
        user,
        "circleMembers",
        "updateRole",
        targetMember,
      );
      expect(result).toBe(false);
    });

    it("should allow MEMBER to view members", () => {
      const user = createUser("member-1", "MEMBER");
      const result = hasCirclePermission(user, "circleMembers", "view");
      expect(result).toBe(true);
    });
  });

  describe("MEMBER role - circleMessages resource", () => {
    it("should allow MEMBER to send messages", () => {
      const user = createUser("member-1", "MEMBER");
      const result = hasCirclePermission(user, "circleMessages", "send");
      expect(result).toBe(true);
    });

    it("should allow MEMBER to read messages", () => {
      const user = createUser("member-1", "MEMBER");
      const result = hasCirclePermission(user, "circleMessages", "read");
      expect(result).toBe(true);
    });

    it("should allow MEMBER to delete their own messages (isSender)", () => {
      const user = createUser("member-1", "MEMBER");
      const message = createMessage(1, "member-1", "circle-1");
      const result = hasCirclePermission(
        user,
        "circleMessages",
        "delete",
        message,
      );
      expect(result).toBe(true);
    });

    it("should not allow MEMBER to delete others' messages", () => {
      const user = createUser("member-1", "MEMBER");
      const message = createMessage(1, "member-2", "circle-1");
      const result = hasCirclePermission(
        user,
        "circleMessages",
        "delete",
        message,
      );
      expect(result).toBe(false);
    });
  });

  describe("function permissions without data", () => {
    it("should return false when permission is a function but no data provided for remove", () => {
      const user = createUser("member-1", "MEMBER");
      const result = hasCirclePermission(user, "circleMembers", "remove");
      expect(result).toBe(false);
    });

    it("should return false when permission is a function but no data provided for delete", () => {
      const user = createUser("member-1", "MEMBER");
      const result = hasCirclePermission(user, "circleMessages", "delete");
      expect(result).toBe(false);
    });

    it("should return false for OWNER remove without data", () => {
      const user = createUser("owner-1", "OWNER");
      const result = hasCirclePermission(user, "circleMembers", "remove");
      expect(result).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should handle member with nested user object", () => {
      const user = createUser("member-1", "MEMBER");
      const memberWithNestedUser = {
        role: "MEMBER" as CircleRole,
        user: { id: "member-1" },
      };
      const result = hasCirclePermission(
        user,
        "circleMembers",
        "remove",
        memberWithNestedUser,
      );
      expect(result).toBe(true);
    });

    it("should handle message with nested sender object", () => {
      const user = createUser("member-1", "MEMBER");
      const messageWithNestedSender = {
        id: 1,
        circleId: "circle-1",
        sender: { id: "member-1" },
      };
      const result = hasCirclePermission(
        user,
        "circleMessages",
        "delete",
        messageWithNestedSender,
      );
      expect(result).toBe(true);
    });

    it("should return false for undefined action", () => {
      const user = createUser("owner-1", "OWNER");
      const result = hasCirclePermission(
        user,
        "circles",
        "invalidAction" as any,
      );
      expect(result).toBe(false);
    });

    it("should return false for undefined resource", () => {
      const user = createUser("owner-1", "OWNER");
      const result = hasCirclePermission(
        user,
        "invalidResource" as any,
        "create",
      );
      expect(result).toBe(false);
    });
  });
});
