import type {
  ChatMember,
  ChatMessage,
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
  static transformMember(member: ChatMember): TransformedChatMember {
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
  static transformMembers(members: ChatMember[]): TransformedChatMember[] {
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
   * Transforms a chat group creator by normalizing the Avatar field.
   *
   * @param group - Raw group data from database
   * @returns Transformed group with lowercase 'avatar' field in creator
   */
  // static transformGroup(group: any): any {
  //   if (!group?.creator) return group;

  //   const { Avatar, ...restCreator } = group.creator;

  //   return {
  //     ...group,
  //     creator: {
  //       ...restCreator,
  //       avatar: Avatar ?? null,
  //     },
  //   };
  // }

  /**
   * Transforms an array of chat groups.
   *
   * @param groups - Array of raw group data
   * @returns Array of transformed groups
   */
  // static transformGroups(groups: any[]): any[] {
  //   return groups.map((group) => this.transformGroup(group));
  // }
}

export default ChatTransformers;
