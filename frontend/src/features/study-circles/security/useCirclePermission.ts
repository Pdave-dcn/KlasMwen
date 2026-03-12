import { useCircleStore } from "@/stores/circle.store";
import type { StudyCircleRole as MemberRole } from "@/zodSchemas/circle.zod";

// ─── Resource / Action Types ────────────────────────────────────────────────

export type CircleResource = "circles" | "circleMembers" | "circleMessages";

export type CircleActions = {
  circles: "create" | "read" | "update" | "delete" | "join" | "invite";
  circleMembers: "add" | "remove" | "updateRole" | "view";
  circleMessages: "send" | "read" | "delete";
};

// ─── Data shapes for function-based checks ──────────────────────────────────

type CircleMemberData = {
  role: MemberRole;
  userId: string;
};

type CircleMessageData = {
  senderId: string;
};

export type ResourceData = {
  circles: never;
  circleMembers: CircleMemberData;
  circleMessages: CircleMessageData;
};

// ─── Policy Types ────────────────────────────────────────────────────────────

export type UIUser = {
  id: string;
  circleRole: MemberRole;
};

type PermissionCheck<R extends CircleResource> =
  | boolean
  | ((user: UIUser, data: ResourceData[R]) => boolean);

type UIPolicy = {
  [Role in MemberRole]: {
    [R in CircleResource]: {
      [A in CircleActions[R]]: PermissionCheck<R>;
    };
  };
};

// ─── Policy Map ──────────────────────────────────────────────────────────────

const UI_CIRCLE_POLICY: UIPolicy = {
  OWNER: {
    circles: {
      create: true,
      read: true,
      update: true,
      delete: true,
      join: false,
      invite: true,
    },
    circleMembers: {
      add: true,
      remove: (_u, member) => member.role !== "OWNER",
      updateRole: (_u, member) => member.role !== "OWNER",
      view: true,
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
    },
    circleMembers: {
      add: true,
      remove: (_u, member) => member.role === "MEMBER",
      updateRole: false,
      view: true,
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
    },
    circleMembers: {
      add: false,
      remove: (u, member) => member.userId === u.id, // leave circle
      updateRole: false,
      view: true,
    },
    circleMessages: {
      send: true,
      read: true,
      delete: (u, message) => message.senderId === u.id,
    },
  },
};

// ─── Core permission check ───────────────────────────────────────────────────

function checkPermission<R extends CircleResource>(
  user: UIUser,
  resource: R,
  action: CircleActions[R],
  data?: ResourceData[R],
): boolean {
  const permission = (
    UI_CIRCLE_POLICY[user.circleRole][resource] as Record<
      string,
      PermissionCheck<R>
    >
  )[action];
  if (typeof permission === "boolean") return permission;
  return data ? permission(user, data) : false;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Returns role-aware permission helpers for the currently selected circle.
 *
 * @example
 * const { can, canDefinitely, isAtLeast } = useCirclePermission();
 *
 * // Static check
 * can("circles", "delete")
 *
 * // Data-dependent — pass the resource data as the third argument
 * can("circleMembers", "remove", { role: member.role, userId: member.userId })
 * can("circleMessages", "delete", { senderId: message.senderId })
 *
 * // Hard static guarantee — function-based permissions treated as false
 * canDefinitely("circles", "delete")
 *
 * // Role hierarchy
 * isAtLeast("MODERATOR")
 */
export function useCirclePermission() {
  const circleRole = useCircleStore((s) => s.currentUserMemberRole);
  const currentUser = useCircleStore((s) => s.currentUser);

  /**
   * Checks whether the current user can perform `action` on `resource`.
   * For function-based permissions pass the resource data as the third argument.
   * Omitting data on a function permission returns false, mirroring the backend.
   */
  function can<R extends CircleResource>(
    resource: R,
    action: CircleActions[R],
    data?: ResourceData[R],
  ): boolean {
    if (!circleRole || !currentUser) return false;
    return checkPermission(
      { id: currentUser.id, circleRole },
      resource,
      action,
      data,
    );
  }

  /**
   * Like `can`, but function-based permissions always return false.
   * Use for bulk actions or any UI that requires an unconditional static guarantee.
   *
   * @example
   * // "Delete circle" is only true for OWNER — no data needed, no ambiguity
   * canDefinitely("circles", "delete")
   */
  function canDefinitely<R extends CircleResource>(
    resource: R,
    action: CircleActions[R],
  ): boolean {
    if (!circleRole || !currentUser) return false;
    const permission = (
      UI_CIRCLE_POLICY[circleRole][resource] as Record<
        string,
        PermissionCheck<R>
      >
    )[action];
    return permission === true;
  }

  /** Role hierarchy: OWNER > MODERATOR > MEMBER */
  const ROLE_RANK: Record<MemberRole, number> = {
    OWNER: 3,
    MODERATOR: 2,
    MEMBER: 1,
  };

  /**
   * Returns `true` if the current user's role is at least `minRole`.
   *
   * @example
   * isAtLeast("MODERATOR") // true for OWNER and MODERATOR
   */
  function isAtLeast(minRole: MemberRole): boolean {
    if (!circleRole) return false;
    return ROLE_RANK[circleRole] >= ROLE_RANK[minRole];
  }

  return {
    role: circleRole,
    can,
    canDefinitely,
    isAtLeast,
    isOwner: circleRole === "OWNER",
    isModerator: circleRole === "MODERATOR",
    isMember: circleRole === "MEMBER",
    hasRole: circleRole !== null,
  };
}
