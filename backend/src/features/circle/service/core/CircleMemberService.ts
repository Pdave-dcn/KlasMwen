import {
  AlreadyMemberError,
  CircleMemberNotFoundError,
} from "../../../../core/error/custom/circle.error.js";
import { processPaginatedResults } from "../../../../utils/pagination.util.js";
import {
  circlePermissionService as defaultCirclePermission,
  type CirclePermissionService,
} from "../../security/CirclePermissionService.js";
import CircleEnricher from "../CircleEnrichers.js";
import CircleTransformers from "../CircleTransformers.js";
import {
  MUTE_DURATION_MS,
  type JoinCircleData,
  type MuteDurationMinutes,
  type UpdateMemberRoleData,
} from "../CircleTypes.js";
import CircleRepository from "../Repositories/CircleRepository.js";

import type { CircleValidationService } from "./CircleValidationService.js";
import type { CircleRole } from "@prisma/client";

export class CircleMemberService {
  constructor(
    private validationService: CircleValidationService,
    private circlePermission: CirclePermissionService = defaultCirclePermission,
  ) {}

  async addMemberToCircle(
    userId: string,
    circleId: string,
    role: CircleRole = "MEMBER",
    requester?: Express.User & { circleRole?: CircleRole },
  ) {
    const circle = await this.validationService.verifyCircleExists(circleId);

    const isMember = await this.validationService.checkMembership(
      userId,
      circleId,
    );
    if (isMember) {
      throw new AlreadyMemberError(userId, circleId);
    }

    if (circle.isPrivate || (requester && requester.id !== userId)) {
      if (requester) {
        this.circlePermission.assertCan(requester, "circleMembers", "add");
      }
    }

    const member = await CircleRepository.addMember(
      { userId, circleId, role },
      new Date(),
    );

    const enrichedMember = CircleEnricher.enrichMember(member);
    return CircleTransformers.transformMember(enrichedMember);
  }

  addMember(
    data: JoinCircleData,
    requester?: Express.User & { circleRole?: CircleRole },
  ) {
    return this.addMemberToCircle(
      data.userId,
      data.circleId,
      data.role,
      requester,
    );
  }

  async removeMember(
    targetUserId: string,
    circleId: string,
    requester: Express.User & { circleRole?: CircleRole },
  ) {
    await this.validationService.verifyCircleExists(circleId);

    const membership = await this.validationService.verifyMembership(
      targetUserId,
      circleId,
    );

    this.circlePermission.assertCanRemoveMember(requester, membership);

    const member = await CircleRepository.removeMember(targetUserId, circleId);
    const enrichedMember = CircleEnricher.enrichMember(member);

    return CircleTransformers.transformMember(enrichedMember);
  }

  async muteMember(
    actor: Omit<Express.User, "email"> & { circleRole?: CircleRole },
    circleId: string,
    targetUserId: string,
    durationMinutes: MuteDurationMinutes | "indefinite",
  ) {
    await this.validationService.verifyCircleExists(circleId);

    const targetMember = await this.validationService.verifyMembership(
      targetUserId,
      circleId,
    );

    this.circlePermission.assertCanMuteMember(actor, {
      role: targetMember.role,
      userId: targetMember.userId,
    });

    const mutedUntil =
      durationMinutes !== "indefinite"
        ? new Date(Date.now() + MUTE_DURATION_MS[durationMinutes])
        : new Date("9999-12-31T23:59:59Z");

    const updated = await CircleRepository.setMemberMute(
      targetUserId,
      circleId,
      mutedUntil,
    );

    const enriched = CircleEnricher.enrichMember(updated);

    return CircleTransformers.transformMember(enriched);
  }

  async unmuteMember(
    actor: Omit<Express.User, "email"> & { circleRole?: CircleRole },
    circleId: string,
    targetUserId: string,
  ) {
    await this.validationService.verifyCircleExists(circleId);

    const targetMember = await this.validationService.verifyMembership(
      targetUserId,
      circleId,
    );

    this.circlePermission.assertCanMuteMember(actor, {
      role: targetMember.role,
      userId: targetMember.userId,
    });

    const updated = await CircleRepository.setMemberMute(
      targetUserId,
      circleId,
      null,
    );

    const enriched = CircleEnricher.enrichMember(updated);

    return CircleTransformers.transformMember(enriched);
  }

  async updateMemberRole(
    targetUserId: string,
    circleId: string,
    data: UpdateMemberRoleData,
    requester: Express.User & { circleRole?: CircleRole },
  ) {
    await this.validationService.verifyCircleExists(circleId);

    const membership = await this.validationService.verifyMembership(
      targetUserId,
      circleId,
    );

    this.circlePermission.assertCanUpdateMemberRole(
      requester,
      membership,
    );

    const member = await CircleRepository.updateMemberRole(
      targetUserId,
      circleId,
      data,
    );
    const enrichedMember = CircleEnricher.enrichMember(member);

    return CircleTransformers.transformMember(enrichedMember);
  }

  async updateLastReadAt(userId: string, circleId: string) {
    await this.validationService.verifyMembership(userId, circleId);

    await CircleRepository.updateLastReadAt(userId, circleId);
  }

  async getCircleMembers(
    userId: string,
    circleId: string,
    pagination: { limit?: number; cursor?: string },
  ) {
    await this.validationService.verifyCircleExists(circleId);

    await this.validationService.verifyIsMember(userId, circleId);

    const limit = pagination.limit ?? 15;

    const members = await CircleRepository.getGroupMembers(
      circleId,
      pagination,
    );

    const result = processPaginatedResults(members, limit, "userId");

    const enrichedMembers = CircleEnricher.enrichMembers(result.data);

    const transformedMembers =
      CircleTransformers.transformMembers(enrichedMembers);

    return {
      data: transformedMembers,
      pagination: result.pagination,
    };
  }

  async getCircleMemberIds(circleId: string) {
    await this.validationService.verifyCircleExists(circleId);

    return await CircleRepository.getCircleMemberIds(circleId);
  }

  async getMutedMembers(
    requester: Express.User & { circleRole?: CircleRole },
    circleId: string,
    pagination: { limit?: number; cursor?: string },
  ) {
    await this.validationService.verifyCircleExists(circleId);
    await this.validationService.verifyIsMember(requester.id, circleId);

    const limit = pagination.limit ?? 15;

    const { data, totalMuted } = await CircleRepository.getMutedMembers(
      circleId,
      pagination,
    );

    const result = processPaginatedResults(data, limit, "userId");

    const enrichedMembers = CircleEnricher.enrichMembers(result.data);

    const transformedMembers =
      CircleTransformers.transformMembers(enrichedMembers);

    return {
      data: transformedMembers,
      pagination: { ...result.pagination, totalMuted },
    };
  }

  async searchCircleMembers(
    userId: string,
    circleId: string,
    query: string,
  ) {
    await this.validationService.verifyCircleExists(circleId);
    await this.validationService.verifyIsMember(userId, circleId);

    const rows = await CircleRepository.searchCircleMembers(circleId, query);

    const enrichedMembers = CircleEnricher.enrichMembers(rows);

    return CircleTransformers.transformMembers(enrichedMembers);
  }

  async getMemberInfo(userId: string, circleId: string) {
    const membership = await CircleRepository.getMembership(userId, circleId);
    if (!membership) {
      throw new CircleMemberNotFoundError(userId, circleId);
    }

    const enrichedMember = CircleEnricher.enrichMember(membership);
    return CircleTransformers.transformMember(enrichedMember);
  }
}
