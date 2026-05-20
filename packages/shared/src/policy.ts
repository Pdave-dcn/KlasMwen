import { isOwner, isNotOwner, isReceiver } from "./helpers.js";

import type { Registry, UserRole } from "./types.js";

type PermissionCheck<K extends keyof Registry> =
  | boolean
  | ((
      user: { id: string; role: UserRole },
      data: Registry[K]["datatype"],
    ) => boolean);

type PolicyMap = Record<
  UserRole,
  Partial<{
    [K in keyof Registry]: Partial<{
      [A in Registry[K]["action"][number]]: PermissionCheck<K>;
    }>;
  }>
>;

export const POLICY: PolicyMap = {
  ADMIN: {
    posts: {
      create: true,
      read: true,
      update: true,
      delete: true,
      report: isNotOwner,
    },
    comments: {
      create: true,
      read: true,
      update: true,
      delete: true,
      report: isNotOwner,
    },
    notifications: {
      read: true,
      update: true,
      delete: true,
    },
  },

  MODERATOR: {
    posts: {
      create: true,
      read: true,
      update: isOwner,
      delete: true,
      report: isNotOwner,
    },
    comments: {
      create: true,
      read: true,
      update: isOwner,
      delete: true,
      report: isNotOwner,
    },
    notifications: {
      read: isReceiver,
      update: isReceiver,
      delete: isReceiver,
    },
  },

  STUDENT: {
    posts: {
      create: true,
      read: true,
      update: isOwner,
      delete: isOwner,
      report: isNotOwner,
    },
    comments: {
      create: true,
      read: true,
      update: isOwner,
      delete: isOwner,
      report: isNotOwner,
    },
    notifications: {
      read: isReceiver,
      update: isReceiver,
      delete: isReceiver,
    },
  },
};
