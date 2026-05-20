import { hasRole, isSender } from "./helpers.js";

import type { CircleRole, CircleRegistry } from "./types.js";

type PermissionCheck<K extends keyof CircleRegistry> =
  | boolean
  | ((
      user: { id: string; circleRole?: CircleRole },
      data: CircleRegistry[K]["datatype"],
    ) => boolean);

type CirclePolicyMap = Record<
  CircleRole,
  Partial<{
    [K in keyof CircleRegistry]: Partial<{
      [A in CircleRegistry[K]["action"][number]]: PermissionCheck<K>;
    }>;
  }>
>;

export const CIRCLE_POLICY: CirclePolicyMap = {
  OWNER: {
    circles: {
      create: true,
      read: true,
      update: true,
      delete: true,
      join: false,
      invite: true,
      leave: false,
    },
    circleMembers: {
      add: true,
      remove: (_u, m) => !hasRole({ circleRole: m.role }, "OWNER"),
      updateRole: (_u, m) => !hasRole({ circleRole: m.role }, "OWNER"),
      view: true,
      mute: (_u, m) => !hasRole({ circleRole: m.role }, "OWNER"),
    },
    circleMessages: {
      send: true,
      read: true,
      delete: true,
    },
  },

  MODERATOR: {
    circles: {
      create: true,
      read: true,
      update: true,
      delete: false,
      join: false,
      invite: true,
      leave: true,
    },
    circleMembers: {
      add: true,
      remove: (_u, m) =>
        !hasRole({ circleRole: m.role }, ["OWNER", "MODERATOR"]),
      updateRole: false,
      view: true,
      mute: (_u, m) => !hasRole({ circleRole: m.role }, ["OWNER", "MODERATOR"]),
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
      invite: false,
      leave: true,
    },
    circleMembers: {
      add: false,
      remove: false,
      updateRole: false,
      view: true,
      mute: false,
    },
    circleMessages: {
      send: true,
      read: true,
      delete: isSender,
    },
  },
};
