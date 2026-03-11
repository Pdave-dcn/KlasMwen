import CircleRepository from "./Repositories/CircleRepository.js";

import type {
  CircleWithMembersAndLatestMsg,
  CircleMember,
  EnrichedCircle,
  EnrichedCircleMember,
} from "./CircleTypes.js";

/**
 * Enriches circle data with additional computed fields and user-specific information.
 */
class CircleEnricher {
  /**
   * Enriches a circle with member count, latest message, unread count and user role.
   * @param circle - The circle to enrich
   * @param userId - User ID to include their role
   * @returns Enriched circle with member count, latest message, unread count, and user role
   */
  static async enrichCircle(
    circle: CircleWithMembersAndLatestMsg,
    userId: string,
  ): Promise<EnrichedCircle> {
    const memberCount = circle._count.members;

    const membership = circle.members.find((m) => m.userId === userId) ?? null;

    const userRole = membership ? membership.role : null;
    const lastReadAt = membership ? membership.lastReadAt : null;
    const latestMessage = circle.messages[0] ?? null;

    const unreadCount = await CircleRepository.countUnreadMessages(
      circle.id,
      userId,
      lastReadAt ?? undefined,
    );

    const { _count, members: _members, ...circleData } = circle;

    return {
      ...circleData,
      memberCount,
      latestMessage,
      unreadCount,
      userRole,
    };
  }

  /**
   * Enriches multiple study circles with member counts and user roles.
   * @param circles - Array of study circles to enrich
   * @param userId - Optional user ID to include their role
   * @returns Array of enriched study circles
   */
  static async enrichCircles(
    circles: CircleWithMembersAndLatestMsg[],
    userId: string,
  ): Promise<EnrichedCircle[]> {
    const unreadCounts =
      await CircleRepository.countUnreadMessagesBatch(userId);

    return circles.map((circle) => {
      const memberCount = circle._count.members;

      const membership =
        circle.members.find((m) => m.userId === userId) ?? null;

      const userRole = membership ? membership.role : null;
      const latestMessage = circle.messages[0] || null;
      const unreadCount = unreadCounts[circle.id] ?? 0;

      const { _count, members: _members, ...circleData } = circle;

      return {
        ...circleData,
        memberCount,
        latestMessage,
        unreadCount,
        userRole,
      };
    });
  }

  /**
   * Transforms a raw database member record into an enriched member object.
   * Maps the 'mutedUntil' timestamp to a simple 'isMuted' boolean and
   * removes sensitive date information from the final object.
   * @param {CircleMember} member - The raw member record from the database.
   * @returns {EnrichedMember} The member object with an active 'isMuted' flag.
   */
  static enrichMember(member: CircleMember): EnrichedCircleMember {
    const now = new Date();
    const { mutedUntil, ...memberData } = member;

    return {
      ...memberData,
      isMuted: mutedUntil ? new Date(mutedUntil) > now : false,
    };
  }

  /**
   * Enriches a collection of group members with real-time status flags.
   * This performs an in-memory transformation, avoiding additional database round-trips.
   * @param {CircleMember[]} members - Array of raw member records.
   * @returns {EnrichedMember[]} Array of members with computed 'isMuted' statuses.
   */
  static enrichMembers(members: CircleMember[]) {
    return members.map((m) => this.enrichMember(m));
  }
}

export default CircleEnricher;
