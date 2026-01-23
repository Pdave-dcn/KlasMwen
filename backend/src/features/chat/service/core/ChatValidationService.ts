import {
  ChatGroupNotFoundError,
  ChatMemberNotFoundError,
  MessageNotFoundError,
  UserMutedError,
} from "../../../../core/error/custom/chat.error.js";
import ChatRepository from "../ChatRepository.js";

import type { SendMessageData } from "../chatTypes.js";

/**
 * Service for chat-related validations.
 * Provides reusable validation methods used across other services.
 */
export class ChatValidationService {
  /**
   * Validates that a chat group exists.
   * @throws {ChatGroupNotFoundError} If the group does not exist
   * @returns The chat group if it exists
   */
  static async verifyGroupExists(chatGroupId: string) {
    const group = await ChatRepository.findGroupById(chatGroupId);
    if (!group) throw new ChatGroupNotFoundError(chatGroupId);
    return group;
  }

  /**
   * Validates that a user is a member of a chat group.
   * @throws {ChatMemberNotFoundError} If user is not a member
   * @returns The membership if it exists
   */
  static async verifyMembership(userId: string, chatGroupId: string) {
    const membership = await ChatRepository.getMembership(userId, chatGroupId);
    if (!membership) {
      throw new ChatMemberNotFoundError(userId, chatGroupId);
    }
    return membership;
  }

  /**
   * Ensures the member is not currently muted.
   * @throws {UserMutedError} if the mute period is still active.
   */
  static async ensureMemberNotMuted(data: SendMessageData) {
    const membership = await ChatRepository.getMembership(
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
    const message = await ChatRepository.findMessageById(messageId);
    if (!message) {
      throw new MessageNotFoundError(messageId);
    }
    return message;
  }

  /**
   * Checks if a user is a member of a group (non-throwing).
   * @returns True if the user is a member, false otherwise
   */
  static async checkMembership(
    userId: string,
    chatGroupId: string,
  ): Promise<boolean> {
    return await ChatRepository.isMember(userId, chatGroupId);
  }
}
