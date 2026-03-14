import {
  AlreadyMemberError,
  CircleNotFoundError,
  CircleMemberNotFoundError,
} from "../../../../core/error/custom/circle.error.js";
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
    const group = await CircleRepository.findCircleById(data.circleId);
    if (!group) throw new CircleNotFoundError(data.circleId);

    // Check if user is already a member
    const isMember = await CircleRepository.isMember(
      data.userId,
      data.circleId,
    );
    if (isMember) {
      throw new AlreadyMemberError(data.userId, data.circleId);
    }

    // For private circles or when adding someone else, check permissions
    if (group.isPrivate || (requester && requester.id !== data.userId)) {
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
    const group = await CircleRepository.findCircleById(circleId);
    if (!group) throw new CircleNotFoundError(circleId);

    const membership = await CircleRepository.getMembership(
      targetUserId,
      circleId,
    );
    if (!membership) {
      throw new CircleMemberNotFoundError(targetUserId, circleId);
    }

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

    return CircleEnricher.enrichMember(updated);
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

    return CircleEnricher.enrichMember(updated);
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
    const group = await CircleRepository.findCircleById(circleId);
    if (!group) throw new CircleNotFoundError(circleId);

    const membership = await CircleRepository.getMembership(
      targetUserId,
      circleId,
    );
    if (!membership) {
      throw new CircleMemberNotFoundError(targetUserId, circleId);
    }

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
    const membership = await CircleRepository.getMembership(userId, circleId);

    if (!membership) {
      throw new CircleMemberNotFoundError(userId, circleId);
    }

    await CircleRepository.updateLastReadAt(userId, circleId);
  }

  /**
   * Retrieves all members of a circle.
   * @throws {CircleNotFoundError} If the circle does not exist
   */
  static async getCircleMembers(circleId: string) {
    const group = await CircleRepository.findCircleById(circleId);
    if (!group) throw new CircleNotFoundError(circleId);

    const members = await CircleRepository.getGroupMembers(circleId);

    const enrichedMembers = CircleEnricher.enrichMembers(members);

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

  /**
   * Checks if a user is a member of a circle.
   */
  static async isMember(userId: string, circleId: string): Promise<boolean> {
    return await CircleRepository.isMember(userId, circleId);
  }
}
