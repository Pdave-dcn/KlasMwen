import { AuthorizationError } from "../../../../core/error/custom/auth.error.js";
import {
  AlreadyMemberError,
  ChatGroupNotFoundError,
} from "../../../../core/error/custom/chat.error.js";
import { getRandomChatGroupAvatar } from "../../../avatar/avatarService.js";
import { assertChatPermission } from "../../security/rbac.js";
import ChatEnricher from "../ChatEnrichers.js";
import ChatRepository from "../Repositories/ChatRepository.js";

import type { CreateChatGroupData, UpdateChatGroupData } from "../chatTypes.js";
import type { ChatRole } from "@prisma/client";

/**
 * Service for chat group operations (CRUD).
 * Handles group creation, updates, deletion, and retrieval.
 */
export class ChatGroupService {
  /**
   * Creates a new chat group with the creator as the owner.
   * Anyone can create a group and automatically becomes the OWNER.
   * @returns The newly created chat group with member count and user role
   */
  static async createGroup(data: CreateChatGroupData) {
    const avatar = await getRandomChatGroupAvatar();
    const group = await ChatRepository.createGroup({
      ...data,
      avatarId: avatar.id,
    });
    return ChatEnricher.enrichGroup(group, data.creatorId);
  }

  /**
   * Allows a user to join a public chat group.
   * Private groups require invitation (not handled here).
   * @param chatGroupId - The chat group ID
   * @param userId - The user ID joining the group
   * @throws {ChatGroupNotFoundError} If the group does not exist
   * @throws {AuthorizationError} If trying to join a private group
   */
  static async joinGroup(chatGroupId: string, userId: string) {
    const group = await ChatRepository.findGroupById(chatGroupId);
    if (!group) throw new ChatGroupNotFoundError(chatGroupId);

    if (group.isPrivate) {
      throw new AuthorizationError(
        "Cannot join private groups without invitation",
      );
    }

    const isMember = await ChatRepository.isMember(userId, chatGroupId);
    if (isMember) {
      throw new AlreadyMemberError(userId, chatGroupId);
    }

    await ChatRepository.addMember({
      userId,
      chatGroupId,
      role: "MEMBER",
    });

    return ChatEnricher.enrichGroup(group, userId);
  }

  /**
   * Retrieves a single chat group by ID.
   * @param chatGroupId - The chat group ID
   * @param userId - Optional user ID to include their role in the group
   * @throws {ChatGroupNotFoundError} If the group does not exist
   */
  static async getGroupById(chatGroupId: string, userId?: string) {
    const group = await ChatRepository.findGroupById(chatGroupId);
    if (!group) throw new ChatGroupNotFoundError(chatGroupId);

    return ChatEnricher.enrichGroup(group, userId);
  }

  /**
   * Retrieves all chat groups a user is a member of.
   * @param userId - The user ID
   * @returns Array of groups with member counts and user's role
   */
  static async getUserGroups(userId: string) {
    const groups = await ChatRepository.findUserGroups(userId);
    return Promise.all(
      groups.map((group) => ChatEnricher.enrichGroup(group, userId)),
    );
  }

  static async getRecentActivityGroups(userId: string, limit = 8) {
    // Fetch potential candidates
    const rawGroups = await ChatRepository.findRecentGroupsWithActivity(
      userId,
      15,
    );

    // Enrich
    const enrichedGroups = await ChatEnricher.enrichGroups(rawGroups, userId);

    // Priority Ranking
    return enrichedGroups
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
   * Updates chat group details (name, description, privacy).
   * Only owners and moderators can update groups.
   * @throws {ChatGroupNotFoundError} If the group does not exist
   * @throws {AuthorizationError} If user lacks permissions
   */
  static async updateGroup(
    chatGroupId: string,
    user: Express.User & { chatRole?: ChatRole },
    data: UpdateChatGroupData,
  ) {
    const group = await ChatRepository.findGroupById(chatGroupId);
    if (!group) throw new ChatGroupNotFoundError(chatGroupId);

    assertChatPermission(user, "chatGroups", "update", group);

    const updatedGroup = await ChatRepository.updateGroup(chatGroupId, data);
    return ChatEnricher.enrichGroup(updatedGroup, user.id);
  }

  /**
   * Deletes a chat group and all associated members and messages.
   * Only the owner can delete a group.
   * @throws {ChatGroupNotFoundError} If the group does not exist
   * @throws {AuthorizationError} If user is not the owner
   */
  static async deleteGroup(
    chatGroupId: string,
    user: Express.User & { chatRole?: ChatRole },
  ) {
    const group = await ChatRepository.findGroupById(chatGroupId);
    if (!group) throw new ChatGroupNotFoundError(chatGroupId);

    assertChatPermission(user, "chatGroups", "delete", group);

    return await ChatRepository.deleteGroup(chatGroupId);
  }
}
