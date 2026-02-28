import {
  ChatGroupNotFoundError,
  MessageNotFoundError,
} from "../../../../core/error/custom/chat.error.js";
import { processPaginatedResults } from "../../../../utils/pagination.util.js";
import { assertChatPermission } from "../../security/rbac.js";
import CircleTransformers from "../CircleTransformers.js";
import CircleRepository from "../Repositories/CircleRepository.js";

import { CircleValidationService } from "./CircleValidationService.js";

import type {
  SendMessageData,
  MessagePaginationCursor,
} from "../CircleTypes.js";
import type { ChatRole } from "@prisma/client";

/**
 * Service for circle message operations.
 * Handles message sending, retrieval, and deletion.
 */
export class CircleMessageService {
  /**
   * Sends a message to a circle.
   * Only circle members can send messages.
   * @throws {ChatGroupNotFoundError} If the circle does not exist
   * @throws {AuthorizationError} If user is not a member
   * @throws {UserMutedError} if user is muted
   */
  static async sendMessage(
    data: SendMessageData,
    user: Omit<Express.User, "email"> & { chatRole?: ChatRole },
  ) {
    const circle = await CircleRepository.findCircleById(data.chatGroupId);
    if (!circle) throw new ChatGroupNotFoundError(data.chatGroupId);

    assertChatPermission(user, "chatMessages", "send");

    await CircleValidationService.ensureMemberNotMuted(data);

    const message = await CircleRepository.createMessage(data);
    return CircleTransformers.transformMessage(message);
  }

  /**
   * Retrieves messages from a circle with cursor-based pagination.
   * Only group members can view messages.
   * @throws {ChatGroupNotFoundError} If the group does not exist
   * @throws {AuthorizationError} If user is not a member
   */
  static async getMessages(
    chatGroupId: string,
    user: Express.User & { chatRole?: ChatRole },
    pagination?: MessagePaginationCursor,
  ) {
    const circle = await CircleRepository.findCircleById(chatGroupId);
    if (!circle) throw new ChatGroupNotFoundError(chatGroupId);

    assertChatPermission(user, "chatMessages", "read");

    const messages = await CircleRepository.getMessages(
      chatGroupId,
      pagination,
    );

    const transformedMessages = CircleTransformers.transformMessages(messages);

    const result = processPaginatedResults(
      transformedMessages,
      pagination?.limit ?? 10,
      "id",
    );

    return result;
  }

  /**
   * Retrieves a single message by ID.
   * @throws {Error} If the message does not exist
   */
  static async getMessageById(messageId: number) {
    const message = await CircleRepository.findMessageById(messageId);
    if (!message) {
      throw new MessageNotFoundError(messageId);
    }

    return CircleTransformers.transformMessage(message);
  }

  /**
   * Deletes a message from a circle.
   * Only the sender, moderators, or owners can delete messages.
   * @throws {MessageNotFoundError} If the message does not exist
   * @throws {AuthorizationError} If user lacks permissions
   */
  static async deleteMessage(
    messageId: number,
    user: Express.User & { chatRole?: ChatRole },
  ) {
    const message = await CircleRepository.findMessageById(messageId);
    if (!message) {
      throw new MessageNotFoundError(messageId);
    }

    assertChatPermission(user, "chatMessages", "delete", message);

    await CircleRepository.deleteMessage(messageId);

    return CircleTransformers.transformMessage(message);
  }

  /**
   * Gets the latest message in a circle.
   */
  static async getLatestMessage(circleId: string) {
    const message = await CircleRepository.getLatestMessage(circleId);
    if (!message) return null;
    return CircleTransformers.transformMessage(message);
  }
}
