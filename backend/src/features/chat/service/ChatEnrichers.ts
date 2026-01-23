import ChatRepository from "./ChatRepository.js";
import ChatTransformers from "./ChatTransformers.js";

import type {
  ChatGroupWithMembers,
  ChatMember,
  EnrichedChatGroup,
  EnrichedChatMember,
  TransformedChatMessage,
} from "./chatTypes.js";

/**
 * Enriches chat data with additional computed fields and user-specific information.
 */
class ChatEnricher {
  /**
   * Enriches a chat group with member count and user's role.
   * @param group - The chat group to enrich
   * @param userId - Optional user ID to include their role
   * @returns Enriched chat group with member count and user role
   */
  static async enrichGroup(
    group: ChatGroupWithMembers,
    userId?: string,
  ): Promise<EnrichedChatGroup> {
    const memberCount = group._count.members;

    let userRole = null;
    if (userId) {
      const membership = await ChatRepository.getMembership(userId, group.id);
      userRole = membership?.role ?? null;
    }

    const latestMessage = await ChatRepository.getLatestMessage(group.id);

    let transformedLatestMessage: TransformedChatMessage | null = null;
    if (latestMessage)
      transformedLatestMessage =
        ChatTransformers.transformMessage(latestMessage);

    const lastReadAt = group.members[0]?.lastReadAt ?? null;
    const unreadCount = await ChatRepository.countUnreadMessages(
      group.id,
      lastReadAt ?? undefined,
    );

    const { _count, members: _members, ...groupData } = group;

    return {
      ...groupData,
      memberCount,
      latestMessage: transformedLatestMessage,
      unreadCount,
      userRole,
    };
  }

  /**
   * Enriches multiple chat groups with member counts and user roles.
   * @param groups - Array of chat groups to enrich
   * @param userId - Optional user ID to include their role
   * @returns Array of enriched chat groups
   */
  static async enrichGroups(
    groups: ChatGroupWithMembers[],
    userId?: string,
  ): Promise<EnrichedChatGroup[]> {
    return await Promise.all(
      groups.map((group) => this.enrichGroup(group, userId)),
    );
  }

  /**
   * Transforms a raw database member record into an enriched member object.
   * Maps the 'mutedUntil' timestamp to a simple 'isMuted' boolean and
   * removes sensitive date information from the final object.
   * @param {ChatMember} member - The raw member record from the database.
   * @returns {EnrichedMember} The member object with an active 'isMuted' flag.
   */
  static enrichMember(member: ChatMember): EnrichedChatMember {
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
   * @param {ChatMember[]} members - Array of raw member records.
   * @returns {EnrichedMember[]} Array of members with computed 'isMuted' statuses.
   */
  static enrichMembers(members: ChatMember[]) {
    return members.map((m) => this.enrichMember(m));
  }
}

export default ChatEnricher;
