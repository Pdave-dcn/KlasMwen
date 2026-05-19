import {
  CircleNotFoundError,
  CircleMemberNotFoundError,
  MessageNotFoundError,
  UserMutedError,
  NotAMemberError,
} from "../../../../core/error/custom/circle.error.js";
import CircleRepository from "../Repositories/CircleRepository.js";

import type { SendMessageData } from "../CircleTypes.js";

export class CircleValidationService {
  async verifyCircleExists(circleId: string) {
    const circle = await CircleRepository.findCircleById(circleId);
    if (!circle) throw new CircleNotFoundError(circleId);
    return circle;
  }

  async verifyMembership(userId: string, circleId: string) {
    const membership = await CircleRepository.getMembership(userId, circleId);
    if (!membership) {
      throw new CircleMemberNotFoundError(userId, circleId);
    }
    return membership;
  }

  async ensureMemberNotMuted(data: SendMessageData) {
    const membership = await CircleRepository.getMembership(
      data.senderId,
      data.circleId,
    );

    const mutedUntil = membership?.mutedUntil;

    if (!mutedUntil || new Date(mutedUntil) <= new Date()) {
      return;
    }

    throw new UserMutedError(data.senderId, data.circleId, mutedUntil);
  }

  async verifyMessageExists(messageId: number) {
    const message = await CircleRepository.findMessageById(messageId);
    if (!message) {
      throw new MessageNotFoundError(messageId);
    }
    return message;
  }

  async checkMembership(
    userId: string,
    circleId: string,
  ): Promise<boolean> {
    return await CircleRepository.isMember(userId, circleId);
  }

  async verifyIsMember(
    userId: string,
    circleId: string,
  ): Promise<boolean> {
    const isMember = await CircleRepository.isMember(userId, circleId);
    if (!isMember) throw new NotAMemberError(userId, circleId);
    return isMember;
  }
}
