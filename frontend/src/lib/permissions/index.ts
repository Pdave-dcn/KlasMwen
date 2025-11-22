import type { registry, Role, User } from "./types";

type Registry = typeof registry;

type PermissionCheck<K extends keyof Registry> =
  | boolean
  | ((user: User, data: Registry[K]["datatype"]) => boolean);

type PolicyMap = {
  [R in Role]: Partial<{
    [K in keyof Registry]: Partial<{
      [A in Registry[K]["action"][number]]: PermissionCheck<K>;
    }>;
  }>;
};

/**
 * Role-based access control policy configuration that defines permissions for different user roles.
 *
 * Defines what actions each role can perform on different resources.
 * Permissions can be either boolean values for simple allow/deny rules, or functions
 * that evaluate ownership or other contextual conditions.
 *
 * @example
 * ```typescript
 * // Admin can delete any post
 * POLICY.ADMIN.posts.delete // true
 *
 * // Student can only update their own posts
 * POLICY.STUDENT.posts.update(user, post) // returns user.id === post.author.id
 * ```
 *
 * @constant
 * @type {PolicyMap}
 */
export const POLICY: PolicyMap = {
  ADMIN: {
    posts: {
      create: true,
      read: true,
      update: true,
      delete: true,
      report: (u, p) => u.id !== p.author.id,
    },
    comments: {
      create: true,
      read: true,
      update: true,
      delete: true,
      report: (u, c) => u.id !== c.author.id,
    },
  },

  MODERATOR: {
    posts: {
      create: true,
      read: true,
      update: (u, p) => u.id === p.author.id,
      delete: true,
      report: (u, p) => u.id !== p.author.id,
    },
    comments: {
      create: true,
      read: true,
      update: (u, c) => u.id === c.author.id,
      delete: true,
      report: (u, c) => u.id !== c.author.id,
    },
  },

  STUDENT: {
    posts: {
      create: true,
      read: true,
      update: (u, p) => u.id === p.author.id,
      delete: (u, p) => u.id === p.author.id,
      report: (u, p) => u.id !== p.author.id,
    },
    comments: {
      create: true,
      read: true,
      update: (u, c) => u.id === c.author.id,
      delete: (u, c) => u.id === c.author.id,
      report: (u, c) => u.id !== c.author.id,
    },
  },

  GUEST: {
    posts: {
      create: true,
      read: true,
      update: (u, p) => u.id === p.author.id,
      delete: (u, p) => u.id === p.author.id,
      report: (u, p) => u.id !== p.author.id,
    },
    comments: {
      create: true,
      read: true,
      update: (u, c) => u.id === c.author.id,
      delete: (u, c) => u.id === c.author.id,
      report: (u, c) => u.id !== c.author.id,
    },
  },
};

/**
 * Checks if a user has permission to perform a specific action on a resource.
 *
 * Evaluates permissions based on the user's role and the requested action. For boolean
 * permissions, returns the boolean value directly. For function permissions, evaluates
 * the function with the provided user and data context.
 *
 * @template Res - The resource type (must be a key of Registry)
 * @param {User} user - The user requesting permission
 * @param {Res} resource - The resource type (e.g., 'posts', 'comments')
 * @param {Registry[Res]["action"][number]} action - The action to perform (e.g., 'create', 'read', 'update', 'delete')
 * @param {Registry[Res]["datatype"]} [data] - The resource data (required for function-based permissions)
 * @returns {boolean} True if the user has permission, false otherwise
 *
 * @example
 * ```typescript
 * const user = { id: 'user1', role: 'STUDENT' };
 * const post = { id: 1, author: { id: 'user1' } };
 *
 * // Check if user can read posts (boolean permission)
 * hasPermission(user, 'posts', 'read'); // true
 *
 * // Check if user can update their own post (function permission)
 * hasPermission(user, 'posts', 'update', post); // true
 *
 * // Check if user can update another user's post
 * const otherPost = { id: 2, author: { id: 'user2' } };
 * hasPermission(user, 'posts', 'update', otherPost); // false
 * ```
 *
 * @throws {never} This function does not throw errors, returns false for invalid permissions
 */
export const hasPermission = <Res extends keyof Registry>(
  user: User,
  resource: Res,
  action: Registry[Res]["action"][number],
  data?: Registry[Res]["datatype"]
): boolean => {
  const permission = POLICY[user.role]?.[resource]?.[action];
  if (permission === undefined) return false;
  if (typeof permission === "boolean") return permission;
  return data ? permission(user, data) : false;
};
