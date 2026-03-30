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
   * INTERNAL: Core logic for adding a member to a circle.
   * Single source of truth for all member additions (user self-join or admin add).
   * Sets lastReadAt to current time to prevent pre-join messages from being counted as unread.
   *
   * @param userId - The user to add
   * @param circleId - The circle to add user to
   * @param role - Member role (default: MEMBER)
   * @param requester - Optional user performing the action (for permission checks). If not provided, public circle join is assumed.
   * @returns Transformed member with user info and role
   * @throws {CircleNotFoundError} If circle doesn't exist
   * @throws {AlreadyMemberError} If user is already a member
   * @throws {AuthorizationError} If permissions denied
   */
  static async addMemberToCircle(
    userId: string,
    circleId: string,
    role: CircleRole = "MEMBER",
    requester?: Express.User & { circleRole?: CircleRole },
  ) {
    // Validate circle exists
    const circle = await CircleValidationService.verifyCircleExists(circleId);

    // Check if user is already a member
    const isMember = await CircleValidationService.checkMembership(
      userId,
      circleId,
    );
    if (isMember) {
      throw new AlreadyMemberError(userId, circleId);
    }

    // Validate permissions based on circle privacy and who is adding
    if (circle.isPrivate || (requester && requester.id !== userId)) {
      if (requester) {
        assertCirclePermission(requester, "circleMembers", "add");
      }
    }

    // Add member with lastReadAt set to current time (prevents pre-join messages from being unread)
    const member = await CircleRepository.addMember(
      { userId, circleId, role },
      new Date(), // lastReadAt
    );

    const enrichedMember = CircleEnricher.enrichMember(member);
    return CircleTransformers.transformMember(enrichedMember);
  }

  /**
   * Adds a user to a circle.
   * For private circles, only owners and moderators can add members.
   * Sets lastReadAt to prevent pre-join messages from counting as unread.
   *
   * @throws {CircleNotFoundError} If the circle does not exist
   * @throws {AlreadyMemberError} If user is already a member
   * @throws {AuthorizationError} If adding to private circle without permission
   */
  static addMember(
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
