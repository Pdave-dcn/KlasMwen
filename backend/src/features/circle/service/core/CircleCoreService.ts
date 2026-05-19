import { AuthorizationError } from "../../../../core/error/custom/auth.error.js";
import {
  CircleMemberNotFoundError,
  CircleNotFoundError,
} from "../../../../core/error/custom/circle.error.js";
import { processPaginatedResults } from "../../../../utils/pagination.util.js";
import { avatarQueryService } from "../../../avatar/service/index.js";
import { assertCirclePermission } from "../../security/rbac.js";
import CircleEnricher from "../CircleEnrichers.js";
import CircleTransformers from "../CircleTransformers.js";
import CircleRepository from "../Repositories/CircleRepository.js";

import type { CircleMemberService } from "./CircleMemberService.js";
import type { CreateCircleData, UpdateCircleData } from "../CircleTypes.js";
import type { CircleRole } from "@prisma/client";

export class CircleCoreService {
  constructor(private memberService: CircleMemberService) {}

  async createCircle(data: CreateCircleData) {
    const avatar = await avatarQueryService.getRandomCircleAvatar();
    const circle = await CircleRepository.createCircle({
      ...data,
      avatarId: avatar.id,
    });
    return CircleEnricher.enrichCircle(circle, data.creatorId);
  }

  async joinCircle(circleId: string, userId: string) {
    const circle = await CircleRepository.findCircleById(circleId);
    if (!circle) throw new CircleNotFoundError(circleId);

    if (circle.isPrivate) {
      throw new AuthorizationError(
        "Cannot join private circles without invitation",
      );
    }

    return await this.memberService.addMemberToCircle(
      userId,
      circleId,
      "MEMBER",
      undefined,
    );
  }

  async leaveCircle(
    circleId: string,
    requester: Express.User & { circleRole?: CircleRole },
  ) {
    const circle = await CircleRepository.findCircleById(circleId);
    if (!circle) throw new CircleNotFoundError(circleId);

    const membership = await CircleRepository.getMembership(
      requester.id,
      circleId,
    );
    if (!membership) {
      throw new CircleMemberNotFoundError(requester.id, circleId);
    }

    assertCirclePermission(requester, "circles", "leave");

    return await CircleRepository.removeMember(requester.id, circleId);
  }

  async getCircleById(circleId: string, userId: string) {
    const circle = await CircleRepository.findCircleById(circleId);
    if (!circle) throw new CircleNotFoundError(circleId);

    return CircleEnricher.enrichCircle(circle, userId);
  }

  async getCirclePreviewDetails(circleId: string) {
    const group = await CircleRepository.getCircleDetails(circleId);
    if (!group) throw new CircleNotFoundError(circleId);

    return CircleTransformers.transformCircleForDetailPage(group);
  }

  async getUserCircles(
    userId: string,
    pagination: { limit?: number; cursor?: string },
  ) {
    const limit = pagination.limit ?? 15;
    const cursor = pagination.cursor ?? undefined;

    const circles = await CircleRepository.findUserCircles(userId, {
      limit,
      cursor,
    });

    const result = processPaginatedResults(circles, limit, "id");

    const enrichedCircles = await CircleEnricher.enrichCircles(
      result.data,
      userId,
    );

    return {
      data: enrichedCircles,
      pagination: result.pagination,
    };
  }

  async getRecentActivityCircles(userId: string, limit = 8) {
    const rawCircles = await CircleRepository.findRecentCirclesWithActivity(
      userId,
      15,
    );

    const enrichedCircles = await CircleEnricher.enrichCircles(
      rawCircles,
      userId,
    );

    return enrichedCircles
      .sort((a, b) => {
        if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
        if (a.unreadCount === 0 && b.unreadCount > 0) return 1;

        const timeA = a.latestMessage
          ? new Date(a.latestMessage.createdAt).getTime()
          : 0;
        const timeB = b.latestMessage
          ? new Date(b.latestMessage.createdAt).getTime()
          : 0;

        if (timeA !== timeB) {
          return timeB - timeA;
        }

        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      })
      .slice(0, limit);
  }

  async updateCircle(
    circleId: string,
    user: Express.User & { circleRole?: CircleRole },
    data: UpdateCircleData,
  ) {
    const circle = await CircleRepository.findCircleById(circleId);
    if (!circle) throw new CircleNotFoundError(circleId);

    assertCirclePermission(user, "circles", "update", circle);

    const updatedCircle = await CircleRepository.updateCircle(circleId, data);
    return CircleEnricher.enrichCircle(updatedCircle, user.id);
  }

  async deleteCircle(
    circleId: string,
    user: Express.User & { circleRole?: CircleRole },
  ) {
    const circle = await CircleRepository.findCircleById(circleId);
    if (!circle) throw new CircleNotFoundError(circleId);

    assertCirclePermission(user, "circles", "delete", circle);

    return await CircleRepository.deleteCircle(circleId);
  }

  async getCircleAvatars(limit = 20, cursor?: number) {
    const avatars = await CircleRepository.getCircleAvatars(limit, cursor);
    return processPaginatedResults(avatars, limit, "id");
  }
}
