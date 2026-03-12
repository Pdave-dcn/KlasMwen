import type { CircleMember } from "@/zodSchemas/circle.zod";

import { useCirclePermission } from "./useCirclePermission";

/**
 * Returns the set of actions the current user can perform on a specific circle member.
 *
 * @example
 * const { canRemove, canUpdateRole, canMute } = useCircleMemberPermissions(member);
 *
 * {canRemove && <RemoveMemberButton />}
 * {canUpdateRole && <PromoteButton />}
 */
export function useCircleMemberPermissions(member: CircleMember) {
  const { can } = useCirclePermission();

  const memberData = { role: member.role, userId: member.userId };

  return {
    // Whether the actions dropdown should be shown at all
    canRemove: can("circleMembers", "remove", memberData),
    canUpdateRole: can("circleMembers", "updateRole", memberData),
    // Mute is a moderation action — scoped to whoever can remove
    canMute: can("circleMembers", "remove", memberData),
  };
}
