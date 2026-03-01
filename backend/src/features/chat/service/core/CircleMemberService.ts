import {
  AlreadyMemberError,
  ChatGroupNotFoundError,
  ChatMemberNotFoundError,
} from "../../../../core/error/custom/chat.error.js";
import { assertCirclePermission } from "../../security/rbac.js";
import CircleEnricher from "../CircleEnrichers.js";
import CircleTransformers from "../CircleTransformers.js";
import CircleRepository from "../Repositories/CircleRepository.js";

import type { JoinCircleData, UpdateMemberRoleData } from "../CircleTypes.js";
import type { CircleRole } from "@prisma/client";

/**
 * Service for circle member operations.
 * Handles member addition, removal, role updates, and retrieval.
 */
export class CircleMemberService {
  /**
   * Adds a user to a circle.
   * For private circles, only owners and moderators can add members.
   * @throws {ChatGroupNotFoundError} If the circle does not exist
   * @throws {AlreadyMemberError} If user is already a member
   * @throws {AuthorizationError} If adding to private circle without permission
   */
  static async addMember(
    data: JoinCircleData,
    requester?: Express.User & { circleRole?: CircleRole },
  ) {
    const group = await CircleRepository.findCircleById(data.circleId);
    if (!group) throw new ChatGroupNotFoundError(data.circleId);

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
   * @throws {ChatGroupNotFoundError} If the circle does not exist
   * @throws {ChatMemberNotFoundError} If user is not a member
   * @throws {AuthorizationError} If trying to remove owner or lacking permissions
   */
  static async removeMember(
    targetUserId: string,
    circleId: string,
    requester: Express.User & { circleRole?: CircleRole },
  ) {
    const group = await CircleRepository.findCircleById(circleId);
    if (!group) throw new ChatGroupNotFoundError(circleId);

    const membership = await CircleRepository.getMembership(
      targetUserId,
      circleId,
    );
    if (!membership) {
      throw new ChatMemberNotFoundError(targetUserId, circleId);
    }

    assertCirclePermission(requester, "circleMembers", "remove", membership);

    const member = await CircleRepository.removeMember(targetUserId, circleId);
    const enrichedMember = CircleEnricher.enrichMember(member);

    return CircleTransformers.transformMember(enrichedMember);
  }

  /**
   * Updates a member's role in a circle.
   * Only owners can change roles.
   * @throws {ChatGroupNotFoundError} If the circle does not exist
   * @throws {ChatMemberNotFoundError} If user is not a member
   * @throws {AuthorizationError} If requester is not owner
   */
  static async updateMemberRole(
    targetUserId: string,
    circleId: string,
    data: UpdateMemberRoleData,
    requester: Express.User & { circleRole?: CircleRole },
  ) {
    const group = await CircleRepository.findCircleById(circleId);
    if (!group) throw new ChatGroupNotFoundError(circleId);

    const membership = await CircleRepository.getMembership(
      targetUserId,
      circleId,
    );
    if (!membership) {
      throw new ChatMemberNotFoundError(targetUserId, circleId);
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
   * @throws {ChatMemberNotFoundError} If user is not a member
   */
  static async updateLastReadAt(userId: string, circleId: string) {
    const membership = await CircleRepository.getMembership(userId, circleId);

    if (!membership) {
      throw new ChatMemberNotFoundError(userId, circleId);
    }

    await CircleRepository.updateLastReadAt(userId, circleId);
  }

  /**
   * Retrieves all members of a circle.
   * @throws {ChatGroupNotFoundError} If the circle does not exist
   */
  static async getCircleMembers(circleId: string) {
    const group = await CircleRepository.findCircleById(circleId);
    if (!group) throw new ChatGroupNotFoundError(circleId);

    const members = await CircleRepository.getGroupMembers(circleId);

    const enrichedMembers = CircleEnricher.enrichMembers(members);

    return CircleTransformers.transformMembers(enrichedMembers);
  }

  /**
   * Gets a specific member's information in a circle.
   * @throws {ChatMemberNotFoundError} If the user is not a member
   */
  static async getMemberInfo(userId: string, circleId: string) {
    const membership = await CircleRepository.getMembership(userId, circleId);
    if (!membership) {
      throw new ChatMemberNotFoundError(userId, circleId);
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
