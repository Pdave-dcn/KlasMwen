import { AuthorizationError } from "../../../../core/error/custom/auth.error.js";
import {
  AlreadyMemberError,
  CircleNotFoundError,
} from "../../../../core/error/custom/circle.error.js";
import { getRandomCircleAvatar } from "../../../avatar/avatarService.js";
import { assertCirclePermission } from "../../security/rbac.js";
import CircleEnricher from "../CircleEnrichers.js";
import CircleTransformers from "../CircleTransformers.js";
import CircleRepository from "../Repositories/CircleRepository.js";

import type { CreateCircleData, UpdateCircleData } from "../CircleTypes.js";
import type { CircleRole } from "@prisma/client";

/**
 * Service for circle operations (CRUD).
 * Handles group creation, updates, deletion, and retrieval.
 */
export class CircleCoreService {
  /**
   * Creates a new circle with the creator as the owner.
   * Anyone can create a group and automatically becomes the OWNER.
   * @returns The newly created circle with member count and user role
   */
  static async createCircle(data: CreateCircleData) {
    const avatar = await getRandomCircleAvatar();
    const circle = await CircleRepository.createCircle({
      ...data,
      avatarId: avatar.id,
    });
    return CircleEnricher.enrichCircle(circle, data.creatorId);
  }

  /**
   * Allows a user to join a public circle.
   * Private groups require invitation (not handled here).
   * @param circleId - The circle ID
   * @param userId - The user ID joining the group
   * @throws {CircleNotFoundError} If the group does not exist
   * @throws {AuthorizationError} If trying to join a private group
   */
  static async joinCircle(circleId: string, userId: string) {
    const group = await CircleRepository.findCircleById(circleId);
    if (!group) throw new CircleNotFoundError(circleId);

    if (group.isPrivate) {
      throw new AuthorizationError(
        "Cannot join private groups without invitation",
      );
    }

    const isMember = await CircleRepository.isMember(userId, circleId);
    if (isMember) {
      throw new AlreadyMemberError(userId, circleId);
    }

    await CircleRepository.addMember({
      userId,
      circleId,
      role: "MEMBER",
    });

    return CircleEnricher.enrichCircle(group, userId);
  }

  /**
   * Retrieves a single circle by ID.
   * @param circleId - The circle ID
   * @param userId - Optional user ID to include their role in the group
   * @throws {CircleNotFoundError} If the group does not exist
   */
  static async getCircleById(circleId: string, userId?: string) {
    const circle = await CircleRepository.findCircleById(circleId);
    if (!circle) throw new CircleNotFoundError(circleId);

    return CircleEnricher.enrichCircle(circle, userId);
  }

  /**
   * Fetches a circle by ID and returns it in a client‑friendly shape.
   * Throws {@link CircleNotFoundError} if missing. Transforms the raw
   * result with {@link CircleTransformers.transformCircleForDetailPage}.
   *
   * @param {string} circleId - ID of the circle to load.
   * @throws {CircleNotFoundError} if the circle doesn't exist.
   * @returns {Promise<TransformedChatGroupDetail>} transformed detail object.
   */
  static async getCirclePreviewDetails(circleId: string) {
    const group = await CircleRepository.getCircleDetails(circleId);
    if (!group) throw new CircleNotFoundError(circleId);

    return CircleTransformers.transformCircleForDetailPage(group);
  }

  /**
   * Retrieves all circles a user is a member of.
   * @param userId - The user ID
   * @returns Array of groups with member counts and user's role
   */
  static async getUserCircles(userId: string) {
    const groups = await CircleRepository.findUserCircles(userId);
    return Promise.all(
      groups.map((group) => CircleEnricher.enrichCircle(group, userId)),
    );
  }

  static async getRecentActivityCircles(userId: string, limit = 8) {
    // Fetch potential candidates
    const rawCircles = await CircleRepository.findRecentCirclesWithActivity(
      userId,
      15,
    );

    // Enrich
    const enrichedCircles = await CircleEnricher.enrichCircles(
      rawCircles,
      userId,
    );

    // Priority Ranking
    return enrichedCircles
      .sort((a, b) => {
        // Priority 1: Unread Activity (Groups with unreads go to the top)
        if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
        if (a.unreadCount === 0 && b.unreadCount > 0) return 1;

        // Priority 2: Latest Interaction (Compare timestamps of latest messages)
        const timeA = a.latestMessage
          ? new Date(a.latestMessage.createdAt).getTime()
          : 0;
        const timeB = b.latestMessage
          ? new Date(b.latestMessage.createdAt).getTime()
          : 0;

        if (timeA !== timeB) {
          return timeB - timeA; // Newer messages first
        }

        // Priority 3: Fallback to Group Creation date if no messages exist
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      })
      .slice(0, limit); // Finally, take the top 8 after sorting
  }

  /**
   * Updates circle details (name, description, privacy).
   * Only owners and moderators can update circles.
   * @throws {CircleNotFoundError} If the circle does not exist
   * @throws {AuthorizationError} If user lacks permissions
   */
  static async updateCircle(
    circleId: string,
    user: Express.User & { circleRole?: CircleRole },
    data: UpdateCircleData,
  ) {
    const group = await CircleRepository.findCircleById(circleId);
    if (!group) throw new CircleNotFoundError(circleId);

    assertCirclePermission(user, "circles", "update", group);

    const updatedGroup = await CircleRepository.updateCircle(circleId, data);
    return CircleEnricher.enrichCircle(updatedGroup, user.id);
  }

  /**
   * Deletes a circle and all associated members and messages.
   * Only the owner can delete a circle.
   * @throws {CircleNotFoundError} If the circle does not exist
   * @throws {AuthorizationError} If user is not the owner
   */
  static async deleteCircle(
    circleId: string,
    user: Express.User & { circleRole?: CircleRole },
  ) {
    const group = await CircleRepository.findCircleById(circleId);
    if (!group) throw new CircleNotFoundError(circleId);

    assertCirclePermission(user, "circles", "delete", group);

    return await CircleRepository.deleteCircle(circleId);
  }
}
