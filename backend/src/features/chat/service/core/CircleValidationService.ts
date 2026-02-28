import {
  ChatGroupNotFoundError,
  ChatMemberNotFoundError,
  MessageNotFoundError,
  UserMutedError,
} from "../../../../core/error/custom/chat.error.js";
import CircleRepository from "../Repositories/CircleRepository.js";

import type { SendMessageData } from "../CircleTypes.js";

/**
 * Service for circle-related validations.
 * Provides reusable validation methods used across other services.
 */
export class CircleValidationService {
  /**
   * Validates that a circle exists.
   * @throws {ChatGroupNotFoundError} If the group does not exist
   * @returns The circle if it exists
   */
  static async verifyCircleExists(circleId: string) {
    const circle = await CircleRepository.findCircleById(circleId);
    if (!circle) throw new ChatGroupNotFoundError(circleId);
    return circle;
  }

  /**
   * Validates that a user is a member of a circle.
   * @throws {ChatMemberNotFoundError} If user is not a member
   * @returns The membership if it exists
   */
  static async verifyMembership(userId: string, circleId: string) {
    const membership = await CircleRepository.getMembership(userId, circleId);
    if (!membership) {
      throw new ChatMemberNotFoundError(userId, circleId);
    }
    return membership;
  }

  /**
   * Ensures the member is not currently muted.
   * @throws {UserMutedError} if the mute period is still active.
   */
  static async ensureMemberNotMuted(data: SendMessageData) {
    const membership = await CircleRepository.getMembership(
      data.senderId,
      data.chatGroupId,
    );

    const mutedUntil = membership?.mutedUntil;

    if (!mutedUntil || new Date(mutedUntil) <= new Date()) {
      return;
    }

    throw new UserMutedError(data.senderId, data.chatGroupId, mutedUntil);
  }

  /**
   * Validates that a message exists.
   * @throws {MessageNotFoundError} If the message does not exist
   * @returns The message if it exists
   */
  static async verifyMessageExists(messageId: number) {
    const message = await CircleRepository.findMessageById(messageId);
    if (!message) {
      throw new MessageNotFoundError(messageId);
    }
    return message;
  }

  /**
   * Checks if a user is a member of a circle (non-throwing).
   * @returns True if the user is a member, false otherwise
   */
  static async checkMembership(
    userId: string,
    circleId: string,
  ): Promise<boolean> {
    return await CircleRepository.isMember(userId, circleId);
  }
}
