import type {
  EnrichedCircleMember,
  StudyCircleRole as MemberRole,
} from "@/zodSchemas/circle.zod";

/**
 * Sorts members by online status first, then by role hierarchy
 * @param members - Array of enriched chat members
 * @returns Sorted array of members
 */
export function sortMembers(
  members: EnrichedCircleMember[],
): EnrichedCircleMember[] {
  const roleOrder: MemberRole[] = ["OWNER", "MODERATOR", "MEMBER"];

  return [...members].sort((a, b) => {
    // Online status first
    if (a.isOnline !== b.isOnline) {
      return a.isOnline ? -1 : 1;
    }
    // Then by role hierarchy
    return roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role);
  });
}

/**
 * Counts the number of online members
 * @param members - Array of enriched chat members
 * @returns Number of online members
 */
export function getOnlineCount(members: EnrichedCircleMember[]): number {
  return members.filter((m) => m.isOnline).length;
}
