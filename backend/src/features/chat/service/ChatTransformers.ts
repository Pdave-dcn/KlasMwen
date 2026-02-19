import type {
  ChatGroupForDiscovery,
  ChatGroupPreviewDetail,
  ChatGroupSuggestionResult,
  ChatMessage,
  EnrichedChatMember,
  TransformedChatGroupForDiscovery,
  TransformedChatGroupPreviewDetail,
  TransformedChatGroupSuggestion,
  TransformedChatMember,
  TransformedChatMessage,
} from "./chatTypes";

/**
 * Transforms raw database data into client-friendly formats.
 * Handles field name normalization and data structure adjustments.
 */
class ChatTransformers {
  /**
   * Transforms a chat member by normalizing the Avatar field to lowercase.
   *
   * @param member - Raw member data from database
   * @returns {TransformedChatMember} Transformed member with lowercase 'avatar' field
   *
   * @example
   * ```typescript
   * const rawMember = {
   *   userId: "123",
   *   user: { id: "123", username: "john", Avatar: { url: "..." } }
   * };
   *
   * const transformed = ChatTransformers.transformMember(rawMember);
   * // { userId: "123", user: { id: "123", username: "john", avatar: { url: "..." } } }
   * ```
   */
  static transformMember(member: EnrichedChatMember): TransformedChatMember {
    const { Avatar, ...restUser } = member.user;

    return {
      ...member,
      user: {
        ...restUser,
        avatar: Avatar ?? null,
      },
    };
  }

  /**
   * Transforms an array of chat members.
   *
   * @param members - Array of raw member data
   * @returns Array of transformed members
   */
  static transformMembers(
    members: EnrichedChatMember[],
  ): TransformedChatMember[] {
    return members.map((member) => this.transformMember(member));
  }

  /**
   * Transforms a chat message sender by normalizing the Avatar field.
   *
   * @param message - Raw message data from database
   * @returns Transformed message with lowercase 'avatar' field in sender
   *
   * @example
   * ```typescript
   * const rawMessage = {
   *   id: 1,
   *   content: "Hello",
   *   sender: { id: "123", username: "john", Avatar: { url: "..." } }
   * };
   *
   * const transformed = ChatTransformers.transformMessage(rawMessage);
   * // sender.avatar.url instead of sender.Avatar.url
   * ```
   */
  static transformMessage(message: ChatMessage): TransformedChatMessage {
    const { Avatar, ...restSender } = message.sender;

    return {
      ...message,
      sender: {
        ...restSender,
        avatar: Avatar ?? null,
      },
    };
  }

  /**
   * Transforms an array of chat messages.
   *
   * @param messages - Array of raw message data
   * @returns Array of transformed messages
   */
  static transformMessages(messages: ChatMessage[]): TransformedChatMessage[] {
    return messages.map((message) => this.transformMessage(message));
  }

  /**
   * Transforms a chat group for discovery by replacing member count.
   *
   * @param group - Raw chat group data from database
   * @returns Transformed chat group with memberCount field
   */
  static transformGroupForDiscovery(
    group: ChatGroupForDiscovery,
  ): TransformedChatGroupForDiscovery {
    const { _count, chatGroupTags, ...groupData } = group;

    return {
      ...groupData,
      memberCount: _count.members,
      tags: chatGroupTags.map((cgt) => cgt.tag),
    };
  }

  /**
   * Transforms an array of chat groups for discovery.
   *
   * @param groups - Array of raw chat group data
   * @returns Array of transformed chat groups
   */
  static transformGroupsForDiscovery(
    groups: ChatGroupForDiscovery[],
  ): TransformedChatGroupForDiscovery[] {
    return groups.map((group) => this.transformGroupForDiscovery(group));
  }

  /**
   * Transforms a chat group suggestion result by replacing member count.
   *
   * @param group - Raw chat group suggestion data from database
   * @returns Transformed chat group suggestion with memberCount field
   */
  static transformGroupForSuggestion(
    group: ChatGroupSuggestionResult,
  ): TransformedChatGroupSuggestion {
    const { _count, ...groupData } = group;

    return {
      ...groupData,
      memberCount: _count.members,
    };
  }

  /**
   * Transforms an array of chat group suggestions.
   *
   * @param groups - Array of raw chat group suggestion data
   * @return Array of transformed chat group suggestions
   */
  static transformGroupsForSuggestion(
    groups: ChatGroupSuggestionResult[],
  ): TransformedChatGroupSuggestion[] {
    return groups.map((group) => this.transformGroupForSuggestion(group));
  }

  /**
   * Transforms a chat group for preview page view with normalized field names.
   * Converts `Avatar` → `avatar`, `_count.members` → `memberCount`, and extracts tags/lastActivityAt.
   *
   * @param group - Raw chat group detail data from database
   * @returns {TransformedChatGroupPreviewDetail} Transformed chat group
   */
  static transformGroupForDetailPage(
    group: ChatGroupPreviewDetail,
  ): TransformedChatGroupPreviewDetail {
    const { Avatar, ...restCreator } = group.creator;
    const { messages, _count, chatGroupTags, ...restData } = group;

    return {
      ...restData,
      creator: {
        ...restCreator,
        avatar: Avatar ?? null,
      },
      lastActivityAt: messages[0].createdAt ?? null,
      tags: chatGroupTags.map((cgt) => cgt.tag),
      memberCount: _count.members,
    };
  }
}

export default ChatTransformers;
