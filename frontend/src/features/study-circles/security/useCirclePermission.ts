import { useCircleStore } from "@/stores/circle.store";
import type { StudyCircleRole as MemberRole } from "@/zodSchemas/circle.zod";

// ─── Resource / Action Types ────────────────────────────────────────────────

type CircleResource = "circles" | "circleMembers" | "circleMessages";

type CircleActions = {
  circles: "create" | "read" | "update" | "delete" | "join" | "invite";
  circleMembers: "add" | "remove" | "updateRole" | "view";
  circleMessages: "send" | "read" | "delete";
};

// ─── Policy Map ─────────────────────────────────────────────────────────────
//
// For UI purposes we only need static true/false.
// Actions that are data-driven functions on the backend (e.g. "can you delete
// *this specific* message?") are marked as `"data-dependent"`.
// The Gatekeeper will treat data-dependent actions as *allowed* by default
// so the button is always visible; the backend is the authoritative check.

type UIPermission = boolean | "data-dependent";

type UIPolicy = {
  [R in MemberRole]: {
    [Resource in CircleResource]: {
      [A in CircleActions[Resource]]: UIPermission;
    };
  };
};

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
      remove: "data-dependent", // Cannot remove other OWNERs — backend enforces
      updateRole: "data-dependent", // Cannot change other OWNERs' roles
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
      remove: "data-dependent", // Cannot remove OWNERs / other MODERATORs
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
      remove: "data-dependent", // Can only remove themselves (leave)
      updateRole: false,
      view: true,
    },
    circleMessages: {
      send: true,
      read: true,
      delete: "data-dependent", // Can only delete their own messages
    },
  },
};

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Returns role-aware permission helpers for the currently selected circle.
 *
 * The hook is intentionally simple: it reflects the *static* part of the
 * backend CIRCLE_POLICY so the UI can show/hide controls without duplicating
 * data-dependent logic (that stays on the server).
 *
 * @example
 * const { can, role, isAtLeast } = useCirclePermission();
 *
 * // Hide the "Delete circle" button for non-owners
 * {can("circles", "delete") && <DeleteCircleButton />}
 *
 * // Show an action that depends on runtime data — always visible, backend guards it
 * {can("circleMessages", "delete") && <DeleteMessageButton />}
 *
 * // Structural role checks
 * {isAtLeast("MODERATOR") && <ModerationPanel />}
 */
export function useCirclePermission() {
  const role = useCircleStore((s) => s.currentUserMemberRole);

  /**
   * Returns `true` when the current user is statically allowed to perform
   * `action` on `resource`, OR when the permission is data-dependent
   * (in which case the UI shows the control and the server makes the final call).
   *
   * Returns `false` when:
   *   - The user has no role in this circle
   *   - The policy explicitly denies the action
   */
  function can<R extends CircleResource>(
    resource: R,
    action: CircleActions[R],
  ): boolean {
    if (!role) return false;
    const permission = (
      UI_CIRCLE_POLICY[role][resource] as Record<string, UIPermission>
    )[action];
    // data-dependent → optimistically show UI; server is the real guard
    return permission === true || permission === "data-dependent";
  }

  /**
   * Returns `true` only for hard-`true` policy entries.
   * Use this when you want to hide a control even for data-dependent cases
   * (e.g. a bulk-action that requires unconditional permission).
   */
  function canDefinitely<R extends CircleResource>(
    resource: R,
    action: CircleActions[R],
  ): boolean {
    if (!role) return false;
    return (
      (UI_CIRCLE_POLICY[role][resource] as Record<string, UIPermission>)[
        action
      ] === true
    );
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
    if (!role) return false;
    return ROLE_RANK[role] >= ROLE_RANK[minRole];
  }

  /** Convenience shortcuts */
  const isOwner = role === "OWNER";
  const isModerator = role === "MODERATOR";
  const isMember = role === "MEMBER";
  const hasRole = role !== null;

  return {
    /** The user's current circle role, or `null` if not a member */
    role,
    /** Check a specific resource/action (data-dependent → true) */
    can,
    /** Check a specific resource/action (data-dependent → false) */
    canDefinitely,
    /** Role hierarchy check */
    isAtLeast,
    // Convenience booleans
    isOwner,
    isModerator,
    isMember,
    hasRole,
  };
}
