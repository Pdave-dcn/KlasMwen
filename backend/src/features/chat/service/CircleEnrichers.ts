import CircleTransformers from "./CircleTransformers.js";
import CircleRepository from "./Repositories/CircleRepository.js";

import type {
  CircleWithMembers,
  CircleMember,
  EnrichedCircle,
  EnrichedCircleMember,
  TransformedCircleMessage,
} from "./CircleTypes.js";

/**
 * Enriches circle data with additional computed fields and user-specific information.
 */
class CircleEnricher {
  /**
   * Enriches a circle with member count and user's role.
   * @param circle - The circle to enrich
   * @param userId - Optional user ID to include their role
   * @returns Enriched circle with member count and user role
   */
  static async enrichCircle(
    circle: CircleWithMembers,
    userId?: string,
  ): Promise<EnrichedCircle> {
    const memberCount = circle._count.members;

    let userRole = null;
    if (userId) {
      const membership = await CircleRepository.getMembership(
        userId,
        circle.id,
      );
      userRole = membership?.role ?? null;
    }

    const latestMessage = await CircleRepository.getLatestMessage(circle.id);

    let transformedLatestMessage: TransformedCircleMessage | null = null;
    if (latestMessage)
      transformedLatestMessage =
        CircleTransformers.transformMessage(latestMessage);

    const lastReadAt = circle.members[0]?.lastReadAt ?? null;
    const unreadCount = await CircleRepository.countUnreadMessages(
      circle.id,
      lastReadAt ?? undefined,
    );

    const { _count, members: _members, ...circleData } = circle;

    return {
      ...circleData,
      memberCount,
      latestMessage: transformedLatestMessage,
      unreadCount,
      userRole,
    };
  }

  /**
   * Enriches multiple chat circles with member counts and user roles.
   * @param circles - Array of chat circles to enrich
   * @param userId - Optional user ID to include their role
   * @returns Array of enriched chat circles
   */
  static async enrichCircles(
    circles: CircleWithMembers[],
    userId?: string,
  ): Promise<EnrichedCircle[]> {
    return await Promise.all(
      circles.map((circle) => this.enrichCircle(circle, userId)),
    );
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
