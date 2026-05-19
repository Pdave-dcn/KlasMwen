import {
  CircleNotFoundError,
  MessageNotFoundError,
} from "../../../../core/error/custom/circle.error.js";
import { processPaginatedResults } from "../../../../utils/pagination.util.js";
import { assertCirclePermission } from "../../security/rbac.js";
import CircleTransformers from "../CircleTransformers.js";
import CircleRepository from "../Repositories/CircleRepository.js";

import type {
  SendMessageData,
  MessagePaginationCursor,
} from "../CircleTypes.js";
import type { CircleValidationService } from "./CircleValidationService.js";
import type { CircleRole } from "@prisma/client";

export class CircleMessageService {
  constructor(private validationService: CircleValidationService) {}

  async sendMessage(
    data: SendMessageData,
    user: Omit<Express.User, "email"> & { userRole?: CircleRole },
  ) {
    const circle = await CircleRepository.findCircleById(data.circleId);
    if (!circle) throw new CircleNotFoundError(data.circleId);

    assertCirclePermission(user, "circleMessages", "send");

    await this.validationService.ensureMemberNotMuted(data);

    const message = await CircleRepository.createMessage(data);
    return CircleTransformers.transformMessage(message);
  }

  async getMessages(
    circleId: string,
    user: Express.User & { circleRole?: CircleRole },
    pagination?: MessagePaginationCursor,
  ) {
    const circle = await CircleRepository.findCircleById(circleId);
    if (!circle) throw new CircleNotFoundError(circleId);

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

  async getMessageById(messageId: number) {
    const message = await CircleRepository.findMessageById(messageId);
    if (!message) {
      throw new MessageNotFoundError(messageId);
    }

    return CircleTransformers.transformMessage(message);
  }

  async deleteMessage(
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

  async getLatestMessage(circleId: string) {
    const message = await CircleRepository.getLatestMessage(circleId);
    if (!message) return null;
    return CircleTransformers.transformMessage(message);
  }
}
