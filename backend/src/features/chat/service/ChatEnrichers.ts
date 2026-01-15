import ChatRepository from "./ChatRepository.js";

import type { ChatGroupWithMembers, EnrichedChatGroup } from "./chatTypes.js";

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
    userId?: string
  ): Promise<EnrichedChatGroup> {
    const memberCount = group._count.members;

    let userRole = null;
    if (userId) {
      const membership = await ChatRepository.getMembership(userId, group.id);
      userRole = membership?.role ?? null;
    }

    const { _count, ...groupData } = group;

    return {
      ...groupData,
      memberCount,
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
    userId?: string
  ): Promise<EnrichedChatGroup[]> {
    return await Promise.all(
      groups.map((group) => this.enrichGroup(group, userId))
    );
  }
}

export default ChatEnricher;
