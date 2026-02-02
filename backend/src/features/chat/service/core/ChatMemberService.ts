import {
  AlreadyMemberError,
  ChatGroupNotFoundError,
  ChatMemberNotFoundError,
} from "../../../../core/error/custom/chat.error.js";
import { assertChatPermission } from "../../security/rbac.js";
import ChatEnricher from "../ChatEnrichers.js";
import ChatTransformers from "../ChatTransformers.js";
import ChatRepository from "../Repositories/ChatRepository.js";

import type { JoinChatGroupData, UpdateMemberRoleData } from "../chatTypes.js";
import type { ChatRole } from "@prisma/client";

/**
 * Service for chat member operations.
 * Handles member addition, removal, role updates, and retrieval.
 */
export class ChatMemberService {
  /**
   * Adds a user to a chat group.
   * For private groups, only owners and moderators can add members.
   * @throws {ChatGroupNotFoundError} If the group does not exist
   * @throws {AlreadyMemberError} If user is already a member
   * @throws {AuthorizationError} If adding to private group without permission
   */
  static async addMember(
    data: JoinChatGroupData,
    requester?: Express.User & { chatRole?: ChatRole },
  ) {
    const group = await ChatRepository.findGroupById(data.chatGroupId);
    if (!group) throw new ChatGroupNotFoundError(data.chatGroupId);

    // Check if user is already a member
    const isMember = await ChatRepository.isMember(
      data.userId,
      data.chatGroupId,
    );
    if (isMember) {
      throw new AlreadyMemberError(data.userId, data.chatGroupId);
    }

    // For private groups or when adding someone else, check permissions
    if (group.isPrivate || (requester && requester.id !== data.userId)) {
      if (requester) {
        assertChatPermission(requester, "chatMembers", "add");
      }
    }

    const member = await ChatRepository.addMember(data);
    const enrichedMember = ChatEnricher.enrichMember(member);
    return ChatTransformers.transformMember(enrichedMember);
  }

  /**
   * Removes a user from a chat group.
   * Users can leave voluntarily, or owners/moderators can remove members.
   * The owner cannot be removed.
   * @throws {ChatGroupNotFoundError} If the group does not exist
   * @throws {ChatMemberNotFoundError} If user is not a member
   * @throws {AuthorizationError} If trying to remove owner or lacking permissions
   */
  static async removeMember(
    targetUserId: string,
    chatGroupId: string,
    requester: Express.User & { chatRole?: ChatRole },
  ) {
    const group = await ChatRepository.findGroupById(chatGroupId);
    if (!group) throw new ChatGroupNotFoundError(chatGroupId);

    const membership = await ChatRepository.getMembership(
      targetUserId,
      chatGroupId,
    );
    if (!membership) {
      throw new ChatMemberNotFoundError(targetUserId, chatGroupId);
    }

    assertChatPermission(requester, "chatMembers", "remove", membership);

    const member = await ChatRepository.removeMember(targetUserId, chatGroupId);
    const enrichedMember = ChatEnricher.enrichMember(member);

    return ChatTransformers.transformMember(enrichedMember);
  }

  /**
   * Updates a member's role in a group.
   * Only owners can change roles.
   * @throws {ChatGroupNotFoundError} If the group does not exist
   * @throws {ChatMemberNotFoundError} If user is not a member
   * @throws {AuthorizationError} If requester is not owner
   */
  static async updateMemberRole(
    targetUserId: string,
    chatGroupId: string,
    data: UpdateMemberRoleData,
    requester: Express.User & { chatRole?: ChatRole },
  ) {
    const group = await ChatRepository.findGroupById(chatGroupId);
    if (!group) throw new ChatGroupNotFoundError(chatGroupId);

    const membership = await ChatRepository.getMembership(
      targetUserId,
      chatGroupId,
    );
    if (!membership) {
      throw new ChatMemberNotFoundError(targetUserId, chatGroupId);
    }

    assertChatPermission(requester, "chatMembers", "updateRole", membership);

    const member = await ChatRepository.updateMemberRole(
      targetUserId,
      chatGroupId,
      data,
    );
    const enrichedMember = ChatEnricher.enrichMember(member);

    return ChatTransformers.transformMember(enrichedMember);
  }

  /**
   * Updates the last read timestamp for a user in a chat group.
   * @throws {ChatMemberNotFoundError} If user is not a member
   */
  static async updateLastReadAt(userId: string, chatGroupId: string) {
    const membership = await ChatRepository.getMembership(userId, chatGroupId);

    if (!membership) {
      throw new ChatMemberNotFoundError(userId, chatGroupId);
    }

    await ChatRepository.updateLastReadAt(userId, chatGroupId);
  }

  /**
   * Retrieves all members of a chat group.
   * @throws {ChatGroupNotFoundError} If the group does not exist
   */
  static async getGroupMembers(chatGroupId: string) {
    const group = await ChatRepository.findGroupById(chatGroupId);
    if (!group) throw new ChatGroupNotFoundError(chatGroupId);

    const members = await ChatRepository.getGroupMembers(chatGroupId);

    const enrichedMembers = ChatEnricher.enrichMembers(members);

    return ChatTransformers.transformMembers(enrichedMembers);
  }

  /**
   * Gets a specific member's information in a group.
   * @throws {ChatMemberNotFoundError} If the user is not a member
   */
  static async getMemberInfo(userId: string, chatGroupId: string) {
    const membership = await ChatRepository.getMembership(userId, chatGroupId);
    if (!membership) {
      throw new ChatMemberNotFoundError(userId, chatGroupId);
    }

    const enrichedMember = ChatEnricher.enrichMember(membership);
    return ChatTransformers.transformMember(enrichedMember);
  }

  /**
   * Checks if a user is a member of a chat group.
   */
  static async isMember(userId: string, chatGroupId: string): Promise<boolean> {
    return await ChatRepository.isMember(userId, chatGroupId);
  }
}
