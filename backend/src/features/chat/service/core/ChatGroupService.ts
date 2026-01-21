import { ChatGroupNotFoundError } from "../../../../core/error/custom/chat.error.js";
import { getRandomChatGroupAvatar } from "../../../avatar/avatarService.js";
import { assertChatPermission } from "../../security/rbac.js";
import ChatEnricher from "../ChatEnrichers.js";
import ChatRepository from "../ChatRepository.js";

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
