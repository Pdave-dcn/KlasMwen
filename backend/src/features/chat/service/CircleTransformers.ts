import type {
  CircleForDiscovery,
  CirclePreviewDetail,
  CircleSuggestionResult,
  CircleMessage,
  EnrichedCircleMember,
  TransformedCircleForDiscovery,
  TransformedCirclePreviewDetail,
  TransformedCircleSuggestion,
  TransformedCircleMember,
  TransformedCircleMessage,
} from "./CircleTypes";

/**
 * Transforms raw database data into client-friendly formats.
 * Handles field name normalization and data structure adjustments.
 */
class CircleTransformers {
  /**
   * Transforms a circle member by normalizing the Avatar field to lowercase.
   *
   * @param member - Raw member data from database
   * @returns {TransformedCircleMember} Transformed member with lowercase 'avatar' field
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
  static transformMember(
    member: EnrichedCircleMember,
  ): TransformedCircleMember {
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
   * Transforms an array of circle members.
   *
   * @param members - Array of raw member data
   * @returns Array of transformed members
   */
  static transformMembers(
    members: EnrichedCircleMember[],
  ): TransformedCircleMember[] {
    return members.map((member) => this.transformMember(member));
  }

  /**
   * Transforms a circle message sender by normalizing the Avatar field.
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
  static transformMessage(message: CircleMessage): TransformedCircleMessage {
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
   * Transforms an array of circle messages.
   *
   * @param messages - Array of raw message data
   * @returns Array of transformed messages
   */
  static transformMessages(
    messages: CircleMessage[],
  ): TransformedCircleMessage[] {
    return messages.map((message) => this.transformMessage(message));
  }

  /**
   * Transforms a circle for discovery by replacing member count.
   *
   * @param circle - Raw circle data from database
   * @returns Transformed circle with memberCount field
   */
  static transformCircleForDiscovery(
    circle: CircleForDiscovery,
  ): TransformedCircleForDiscovery {
    const { _count, circleTags, ...circleData } = circle;

    return {
      ...circleData,
      memberCount: _count.members,
      tags: circleTags.map((cgt) => cgt.tag),
    };
  }

  /**
   * Transforms an array of circles for discovery.
   *
   * @param circles - Array of raw circle data
   * @returns Array of transformed circles
   */
  static transformCirclesForDiscovery(
    circles: CircleForDiscovery[],
  ): TransformedCircleForDiscovery[] {
    return circles.map((circle) => this.transformCircleForDiscovery(circle));
  }

  /**
   * Transforms a circle suggestion result by replacing member count.
   *
   * @param circle - Raw circle suggestion data from database
   * @returns Transformed circle suggestion with memberCount field
   */
  static transformCircleForSuggestion(
    circle: CircleSuggestionResult,
  ): TransformedCircleSuggestion {
    const { _count, ...circleData } = circle;

    return {
      ...circleData,
      memberCount: _count.members,
    };
  }

  /**
   * Transforms an array of circle suggestions.
   *
   * @param circles - Array of raw circle suggestion data
   * @return Array of transformed circle suggestions
   */
  static transformCirclesForSuggestion(
    circles: CircleSuggestionResult[],
  ): TransformedCircleSuggestion[] {
    return circles.map((circle) => this.transformCircleForSuggestion(circle));
  }

  /**
   * Transforms a circle for preview page view with normalized field names.
   * Converts `Avatar` → `avatar`, `_count.members` → `memberCount`, and extracts tags/lastActivityAt.
   *
   * @param circle - Raw circle detail data from database
   * @returns {TransformedCirclePreviewDetail} Transformed circle detail with normalized fields and additional info
   *
   */
  static transformCircleForDetailPage(
    circle: CirclePreviewDetail,
  ): TransformedCirclePreviewDetail {
    const { Avatar, ...restCreator } = circle.creator;
    const { messages, _count, circleTags, ...restData } = circle;

    return {
      ...restData,
      creator: {
        ...restCreator,
        avatar: Avatar ?? null,
      },
      lastActivityAt: messages[0].createdAt ?? null,
      tags: circleTags.map((cgt) => cgt.tag),
      memberCount: _count.members,
    };
  }
}

export default CircleTransformers;
