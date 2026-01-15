import { hasRole, isSender, isMemberUser } from "./helpers.js";

import type { ChatRegistry } from "./types.js";
import type { ChatRole } from "@prisma/client";

type PermissionCheck<K extends keyof ChatRegistry> =
  | boolean
  | ((
      user: Express.User & { chatRole?: ChatRole },
      data: ChatRegistry[K]["datatype"]
    ) => boolean);

type ChatPolicyMap = {
  [R in ChatRole]: Partial<{
    [K in keyof ChatRegistry]: Partial<{
      [A in ChatRegistry[K]["action"][number]]: PermissionCheck<K>;
    }>;
  }>;
};

/**
 * Chat-specific RBAC policy.
 *
 * Unlike the main POLICY which uses global user roles (ADMIN, MODERATOR, STUDENT),
 * CHAT_POLICY uses chat-specific roles (OWNER, MODERATOR, MEMBER) that are
 * assigned per chat group.
 *
 */
export const CHAT_POLICY: ChatPolicyMap = {
  OWNER: {
    chatGroups: {
      create: true, // Anyone can create groups (becomes owner)
      read: true,
      update: true, // Owner can update their groups
      delete: true, // Owner can delete their groups
      join: false, // Owner is already a member
      invite: true, // Owner can invite others
    },
    chatMembers: {
      add: true, // Owner can add members
      remove: (u, m) => !hasRole({ ...u, chatRole: m.role }, "OWNER"), // Cannot remove other owners
      updateRole: (u, m) => !hasRole({ ...u, chatRole: m.role }, "OWNER"), // Cannot change other owners' roles
      view: true, // Owner can view all members
    },
    chatMessages: {
      send: true, // Owner can send messages
      read: true, // Owner can read messages
      delete: true, // Owner can delete any message
    },
  },

  MODERATOR: {
    chatGroups: {
      create: true,
      read: true,
      update: true, // Moderator can update group settings
      delete: false, // Only owner can delete
      join: false, // Moderator is already a member
      invite: true, // Moderator can invite others
    },
    chatMembers: {
      add: true, // Moderator can add members
      remove: (u, m) =>
        !hasRole({ ...u, chatRole: m.role }, ["OWNER", "MODERATOR"]), // Cannot remove owners or other moderators
      updateRole: false, // Only owner can change roles
      view: true, // Moderator can view all members
    },
    chatMessages: {
      send: true,
      read: true,
      delete: true,
    },
  },

  MEMBER: {
    chatGroups: {
      create: true,
      read: true,
      update: false,
      delete: false,
      join: true,
      invite: false, // Members cannot invite (unless changed by owner)
    },
    chatMembers: {
      add: false, // Members cannot add other members
      remove: isMemberUser, // Members can only remove themselves (leave)
      updateRole: false, // Members cannot change roles
      view: true, // Members can view other members
    },
    chatMessages: {
      send: true,
      read: true,
      delete: isSender, // Members can only delete their own messages
    },
  },
};
