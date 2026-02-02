import type {
  ChatGroupForDiscovery,
  ChatMessage,
  EnrichedChatMember,
  TransformedChatGroupForDiscovery,
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
    const { _count, ...groupData } = group;

    return {
      ...groupData,
      memberCount: _count.members,
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
}

export default ChatTransformers;
