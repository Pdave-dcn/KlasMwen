import {
  AlreadyMemberError,
  CircleMemberNotFoundError,
} from "../../../../core/error/custom/circle.error.js";
import { processPaginatedResults } from "../../../../utils/pagination.util.js";
import { assertCirclePermission } from "../../security/rbac.js";
import CircleEnricher from "../CircleEnrichers.js";
import CircleTransformers from "../CircleTransformers.js";
import {
  MUTE_DURATION_MS,
  type JoinCircleData,
  type MuteDurationMinutes,
  type UpdateMemberRoleData,
} from "../CircleTypes.js";
import CircleRepository from "../Repositories/CircleRepository.js";

import { CircleValidationService } from "./CircleValidationService.js";

import type { CircleRole } from "@prisma/client";

/**
 * Service for circle member operations.
 * Handles member addition, removal, role updates, and retrieval.
 */
export class CircleMemberService {
  /**
   * Adds a user to a circle.
   * For private circles, only owners and moderators can add members.
   * @throws {CircleNotFoundError} If the circle does not exist
   * @throws {AlreadyMemberError} If user is already a member
   * @throws {AuthorizationError} If adding to private circle without permission
   */
  static async addMember(
    data: JoinCircleData,
    requester?: Express.User & { circleRole?: CircleRole },
  ) {
    const circle = await CircleValidationService.verifyCircleExists(
      data.circleId,
    );

    // Check if user is already a member
    const isMember = await CircleValidationService.checkMembership(
      data.userId,
      data.circleId,
    );
    if (isMember) {
      throw new AlreadyMemberError(data.userId, data.circleId);
    }

    // For private circles or when adding someone else, check permissions
    if (circle.isPrivate || (requester && requester.id !== data.userId)) {
      if (requester) {
        assertCirclePermission(requester, "circleMembers", "add");
      }
    }

    const member = await CircleRepository.addMember(data);
    const enrichedMember = CircleEnricher.enrichMember(member);
    return CircleTransformers.transformMember(enrichedMember);
  }

  /**
   * Removes a user from a circle.
   * Users can leave voluntarily, or owners/moderators can remove members.
   * The owner cannot be removed.
   * @throws {CircleNotFoundError} If the circle does not exist
   * @throws {CircleMemberNotFoundError} If user is not a member
   * @throws {AuthorizationError} If trying to remove owner or lacking permissions
   */
  static async removeMember(
    targetUserId: string,
    circleId: string,
    requester: Express.User & { circleRole?: CircleRole },
  ) {
    await CircleValidationService.verifyCircleExists(circleId);

    const membership = await CircleValidationService.verifyMembership(
      targetUserId,
      circleId,
    );

    assertCirclePermission(requester, "circleMembers", "remove", membership);

    const member = await CircleRepository.removeMember(targetUserId, circleId);
    const enrichedMember = CircleEnricher.enrichMember(member);

    return CircleTransformers.transformMember(enrichedMember);
  }

  /**
   * Mutes a circle member for a given duration or indefinitely.
   *
   * Permissions:
   * - OWNER can mute any MODERATOR or MEMBER
   * - MODERATOR can only mute MEMBERs
   *
   * @param actor     - The user performing the mute
   * @param circleId  - The circle in which the mute applies
   * @param targetUserId - The user to mute
   * @param durationMinutes - Duration in minutes, or "indefinite" for indefinite mute
   */
  static async muteMember(
    actor: Omit<Express.User, "email"> & { circleRole?: CircleRole },
    circleId: string,
    targetUserId: string,
    durationMinutes: MuteDurationMinutes | "indefinite",
  ) {
    await CircleValidationService.verifyCircleExists(circleId);

    // Fetch the target's membership to run the data-dependent permission check
    const targetMember = await CircleValidationService.verifyMembership(
      targetUserId,
      circleId,
    );

    // OWNER can mute anyone below OWNER, MODERATOR can only mute MEMBERs
    assertCirclePermission(actor, "circleMembers", "mute", {
      role: targetMember.role,
      userId: targetMember.userId,
    });

    const mutedUntil =
      durationMinutes !== "indefinite"
        ? new Date(Date.now() + MUTE_DURATION_MS[durationMinutes])
        : new Date("9999-12-31T23:59:59Z"); // sentinel for indefinite

    const updated = await CircleRepository.setMemberMute(
      targetUserId,
      circleId,
      mutedUntil,
    );

    const enriched = CircleEnricher.enrichMember(updated);

    return CircleTransformers.transformMember(enriched);
  }

  /**
   * Unmutes a circle member.
   *
   * Permissions: same hierarchy as muteMember.
   *
   * @param actor        - The user performing the unmute
   * @param circleId     - The circle in which the unmute applies
   * @param targetUserId - The user to unmute
   */
  static async unmuteMember(
    actor: Omit<Express.User, "email"> & { circleRole?: CircleRole },
    circleId: string,
    targetUserId: string,
  ) {
    await CircleValidationService.verifyCircleExists(circleId);

    const targetMember = await CircleValidationService.verifyMembership(
      targetUserId,
      circleId,
    );

    assertCirclePermission(actor, "circleMembers", "mute", {
      role: targetMember.role,
      userId: targetMember.userId,
    });

    const updated = await CircleRepository.setMemberMute(
      targetUserId,
      circleId,
      null, // clear the mute
    );

    const enriched = CircleEnricher.enrichMember(updated);

    return CircleTransformers.transformMember(enriched);
  }

  /**
   * Updates a member's role in a circle.
   * Only owners can change roles.
   * @throws {CircleNotFoundError} If the circle does not exist
   * @throws {CircleMemberNotFoundError} If user is not a member
   * @throws {AuthorizationError} If requester is not owner
   */
  static async updateMemberRole(
    targetUserId: string,
    circleId: string,
    data: UpdateMemberRoleData,
    requester: Express.User & { circleRole?: CircleRole },
  ) {
    await CircleValidationService.verifyCircleExists(circleId);

    const membership = await CircleValidationService.verifyMembership(
      targetUserId,
      circleId,
    );

    assertCirclePermission(
      requester,
      "circleMembers",
      "updateRole",
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

  /**
   * Updates the last read timestamp for a user in a circle.
   * @throws {CircleMemberNotFoundError} If user is not a member
   */
  static async updateLastReadAt(userId: string, circleId: string) {
    await CircleValidationService.verifyMembership(userId, circleId);

    await CircleRepository.updateLastReadAt(userId, circleId);
  }

  /**
   * Retrieves a list of members with pagination meta data.
   * @throws {CircleNotFoundError} If the circle does not exist
   */
  static async getCircleMembers(
    userId: string,
    circleId: string,
    pagination: { limit?: number; cursor?: string },
  ) {
    await CircleValidationService.verifyCircleExists(circleId);

    await CircleValidationService.verifyIsMember(userId, circleId);

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

  /**
   * Returns the user IDs of all members in a circle without pagination.
   * Use this only when the full member list is needed at once — for example,
   * for presence checks in the socket layer. Avoid for display purposes;
   * use the paginated getCircleMembers instead.
   *
   * @throws {CircleNotFoundError} If the circle does not exist
   */
  static async getCircleMemberIds(circleId: string) {
    await CircleValidationService.verifyCircleExists(circleId);

    return await CircleRepository.getCircleMemberIds(circleId);
  }

  /**
   * Retrieves a paginated list of muted members in a circle.
   *
   * @returns Paginated list of muted members with total count
   * @throws {CircleNotFoundError} If circle doesn't exist
   * @throws {NotAMemberError} If requester isn't a member
   */
  static async getMutedMembers(
    requester: Express.User & { circleRole?: CircleRole },
    circleId: string,
    pagination: { limit?: number; cursor?: string },
  ) {
    await CircleValidationService.verifyCircleExists(circleId);
    await CircleValidationService.verifyIsMember(requester.id, circleId);

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

  /**
   * Searches for members in a circle by username.
   *
   * @param circleId       - The circle to search in
   * @param query          - Partial username to search for
   */
  static async searchCircleMembers(
    userId: string,
    circleId: string,
    query: string,
  ) {
    await CircleValidationService.verifyCircleExists(circleId);
    await CircleValidationService.verifyIsMember(userId, circleId);

    const rows = await CircleRepository.searchCircleMembers(circleId, query);

    const enrichedMembers = CircleEnricher.enrichMembers(rows);

    return CircleTransformers.transformMembers(enrichedMembers);
  }

  /**
   * Gets a specific member's information in a circle.
   * @throws {CircleMemberNotFoundError} If the user is not a member
   */
  static async getMemberInfo(userId: string, circleId: string) {
    const membership = await CircleRepository.getMembership(userId, circleId);
    if (!membership) {
      throw new CircleMemberNotFoundError(userId, circleId);
    }

    const enrichedMember = CircleEnricher.enrichMember(membership);
    return CircleTransformers.transformMember(enrichedMember);
  }
}
