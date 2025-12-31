import { getAuthorId, isOwner } from "./helpers.js";

import type { Registry } from "./types.js";
import type { Role } from "@prisma/client";

type PermissionCheck<K extends keyof Registry> =
  | boolean
  | ((user: Express.User, data: Registry[K]["datatype"]) => boolean);

type PolicyMap = {
  [R in Role]: Partial<{
    [K in keyof Registry]: Partial<{
      [A in Registry[K]["action"][number]]: PermissionCheck<K>;
    }>;
  }>;
};

export const POLICY: PolicyMap = {
  ADMIN: {
    posts: {
      create: true,
      read: true,
      update: true,
      delete: true,
      report: (u, p) => u.id !== getAuthorId(p),
    },
    comments: {
      create: true,
      read: true,
      update: true,
      delete: true,
      report: (u, c) => u.id !== getAuthorId(c),
    },
  },

  MODERATOR: {
    posts: {
      create: true,
      read: true,
      update: isOwner,
      delete: true,
      report: (u, p) => u.id !== getAuthorId(p),
    },
    comments: {
      create: true,
      read: true,
      update: isOwner,
      delete: true,
      report: (u, c) => u.id !== getAuthorId(c),
    },
  },

  STUDENT: {
    posts: {
      create: true,
      read: true,
      update: isOwner,
      delete: isOwner,
      report: (u, p) => u.id !== getAuthorId(p),
    },
    comments: {
      create: true,
      read: true,
      update: isOwner,
      delete: isOwner,
      report: (u, c) => u.id !== getAuthorId(c),
    },
  },

  GUEST: {
    posts: {
      create: true,
      read: true,
      update: isOwner,
      delete: isOwner,
      report: (u, p) => u.id !== getAuthorId(p),
    },
    comments: {
      create: true,
      read: true,
      update: isOwner,
      delete: isOwner,
      report: (u, c) => u.id !== getAuthorId(c),
    },
  },
};
