import { hasRole, isSender } from "./helpers.js";

import type { CircleRegistry } from "./types.js";
import type { CircleRole } from "@prisma/client";

type PermissionCheck<K extends keyof CircleRegistry> =
  | boolean
  | ((
      user: Omit<Express.User, "email"> & { circleRole?: CircleRole },
      data: CircleRegistry[K]["datatype"],
    ) => boolean);

type ChatPolicyMap = {
  [R in CircleRole]: Partial<{
    [K in keyof CircleRegistry]: Partial<{
      [A in CircleRegistry[K]["action"][number]]: PermissionCheck<K>;
    }>;
  }>;
};

/**
 * Circle-specific RBAC policy.
 *
 * Unlike the main POLICY which uses global user roles (ADMIN, MODERATOR, STUDENT),
 * CIRCLE_POLICY uses circle-specific roles (OWNER, MODERATOR, MEMBER) that are
 * assigned per study circle.
 *
 */
export const CIRCLE_POLICY: ChatPolicyMap = {
  OWNER: {
    circles: {
      create: true, // Anyone can create circles (becomes owner)
      read: true,
      update: true, // Owner can update their circles
      delete: true, // Owner can delete their circles
      join: false, // Owner is already a member
      invite: true, // Owner can invite others
      leave: false, // Owner cannot leave its own circle (without transferring ownership first)
    },
    circleMembers: {
      add: true, // Owner can add members
      remove: (u, m) => !hasRole({ ...u, circleRole: m.role }, "OWNER"), // Cannot remove other owners
      updateRole: (u, m) => !hasRole({ ...u, circleRole: m.role }, "OWNER"), // Cannot change other owners' roles
      view: true, // Owner can view all members
      mute: (u, m) => !hasRole({ ...u, circleRole: m.role }, "OWNER"), // Cannot mute other owners
    },
    circleMessages: {
      send: true, // Owner can send messages
      read: true, // Owner can read messages
      delete: true, // Owner can delete any message
    },
  },

  MODERATOR: {
    circles: {
      create: true,
      read: true,
      update: true, // Moderator can update circle settings
      delete: false, // Only owner can delete
      join: false, // Moderator is already a member
      invite: true, // Moderator can invite others
      leave: true, // Moderator can leave
    },
    circleMembers: {
      add: true, // Moderator can add members
      remove: (u, m) =>
        !hasRole({ ...u, circleRole: m.role }, ["OWNER", "MODERATOR"]), // Cannot remove owners or other moderators
      updateRole: false, // Only owner can change roles
      view: true, // Moderator can view all members
      mute: (u, m) =>
        !hasRole({ ...u, circleRole: m.role }, ["OWNER", "MODERATOR"]), // Cannot mute owners or other moderators
    },
    circleMessages: {
      send: true,
      read: true,
      delete: true,
    },
  },

  MEMBER: {
    circles: {
      create: true,
      read: true,
      update: false,
      delete: false,
      join: true,
      invite: false, // Members cannot invite (unless changed by owner)
      leave: true,
    },
    circleMembers: {
      add: false, // Members cannot add other members
      remove: false, // Members cannot remove other members
      updateRole: false, // Members cannot change roles
      view: true, // Members can view other members
      mute: false, // Members cannot mute anyone
    },
    circleMessages: {
      send: true,
      read: true,
      delete: isSender, // Members can only delete their own messages
    },
  },
};
