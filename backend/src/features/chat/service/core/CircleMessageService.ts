import {
  ChatGroupNotFoundError,
  MessageNotFoundError,
} from "../../../../core/error/custom/chat.error.js";
import { processPaginatedResults } from "../../../../utils/pagination.util.js";
import { assertCirclePermission } from "../../security/rbac.js";
import CircleTransformers from "../CircleTransformers.js";
import CircleRepository from "../Repositories/CircleRepository.js";

import { CircleValidationService } from "./CircleValidationService.js";

import type {
  SendMessageData,
  MessagePaginationCursor,
} from "../CircleTypes.js";
import type { CircleRole } from "@prisma/client";

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
    user: Omit<Express.User, "email"> & { userRole?: CircleRole },
  ) {
    const circle = await CircleRepository.findCircleById(data.circleId);
    if (!circle) throw new ChatGroupNotFoundError(data.circleId);

    assertCirclePermission(user, "circleMessages", "send");

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
    circleId: string,
    user: Express.User & { circleRole?: CircleRole },
    pagination?: MessagePaginationCursor,
  ) {
    const circle = await CircleRepository.findCircleById(circleId);
    if (!circle) throw new ChatGroupNotFoundError(circleId);

    assertCirclePermission(user, "circleMessages", "read");

    const messages = await CircleRepository.getMessages(circleId, pagination);

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
    user: Express.User & { circleRole?: CircleRole },
  ) {
    const message = await CircleRepository.findMessageById(messageId);
    if (!message) {
      throw new MessageNotFoundError(messageId);
    }

    assertCirclePermission(user, "circleMessages", "delete", message);

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
