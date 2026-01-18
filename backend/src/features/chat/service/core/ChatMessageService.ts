import {
  ChatGroupNotFoundError,
  MessageNotFoundError,
} from "../../../../core/error/custom/chat.error.js";
import { assertChatPermission } from "../../security/rbac.js";
import ChatRepository from "../ChatRepository.js";

import type { SendMessageData, MessagePaginationCursor } from "../chatTypes.js";
import type { ChatRole } from "@prisma/client";

/**
 * Service for chat message operations.
 * Handles message sending, retrieval, and deletion.
 */
export class ChatMessageService {
  /**
   * Sends a message to a chat group.
   * Only group members can send messages.
   * @throws {ChatGroupNotFoundError} If the group does not exist
   * @throws {AuthorizationError} If user is not a member
   */
  static async sendMessage(
    data: SendMessageData,
    user: Omit<Express.User, "email"> & { chatRole?: ChatRole },
  ) {
    const group = await ChatRepository.findGroupById(data.chatGroupId);
    if (!group) throw new ChatGroupNotFoundError(data.chatGroupId);

    assertChatPermission(user, "chatMessages", "send");

    return await ChatRepository.createMessage(data);
  }

  /**
   * Retrieves messages from a chat group with cursor-based pagination.
   * Only group members can view messages.
   * @throws {ChatGroupNotFoundError} If the group does not exist
   * @throws {AuthorizationError} If user is not a member
   */
  static async getMessages(
    chatGroupId: string,
    user: Express.User & { chatRole?: ChatRole },
    pagination?: MessagePaginationCursor,
  ) {
    const group = await ChatRepository.findGroupById(chatGroupId);
    if (!group) throw new ChatGroupNotFoundError(chatGroupId);

    assertChatPermission(user, "chatMessages", "read");

    return await ChatRepository.getMessages(chatGroupId, pagination);
  }

  /**
   * Retrieves a single message by ID.
   * @throws {Error} If the message does not exist
   */
  static async getMessageById(messageId: number) {
    const message = await ChatRepository.findMessageById(messageId);
    if (!message) {
      throw new MessageNotFoundError(messageId);
    }

    return message;
  }

  /**
   * Deletes a message from a chat group.
   * Only the sender, moderators, or owners can delete messages.
   * @throws {MessageNotFoundError} If the message does not exist
   * @throws {AuthorizationError} If user lacks permissions
   */
  static async deleteMessage(
    messageId: number,
    user: Express.User & { chatRole?: ChatRole },
  ) {
    const message = await ChatRepository.findMessageById(messageId);
    if (!message) {
      throw new MessageNotFoundError(messageId);
    }

    assertChatPermission(user, "chatMessages", "delete", message);

    return await ChatRepository.deleteMessage(messageId);
  }

  /**
   * Gets the latest message in a chat group.
   */
  static async getLatestMessage(chatGroupId: string) {
    return await ChatRepository.getLatestMessage(chatGroupId);
  }
}
