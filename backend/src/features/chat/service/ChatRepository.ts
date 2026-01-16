import prisma from "../../../core/config/db.js";
import { processPaginatedResults } from "../../../utils/pagination.util.js";

import {
  BaseSelectors,
  type CreateChatGroupData,
  type UpdateChatGroupData,
  type JoinChatGroupData,
  type UpdateMemberRoleData,
  type SendMessageData,
  type MessagePaginationCursor,
} from "./chatTypes.js";

class ChatRepository {
  //Chat Group Operations

  /** Find a single chat group by ID */
  static async findGroupById(chatGroupId: string) {
    return await prisma.chatGroup.findUnique({
      where: { id: chatGroupId },
      select: BaseSelectors.chatGroupWithMembers,
    });
  }

  /** Create a new chat group and add creator as owner */
  static async createGroup(data: CreateChatGroupData) {
    return await prisma.chatGroup.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        isPrivate: data.isPrivate ?? false,
        creatorId: data.creatorId,
        members: {
          create: {
            userId: data.creatorId,
            role: "OWNER",
          },
        },
      },
      select: BaseSelectors.chatGroupWithMembers,
    });
  }

  /** Update chat group details */
  static async updateGroup(chatGroupId: string, data: UpdateChatGroupData) {
    return await prisma.chatGroup.update({
      where: { id: chatGroupId },
      data: {
        name: data.name,
        description: data.description,
        isPrivate: data.isPrivate,
      },
      select: BaseSelectors.chatGroupWithMembers,
    });
  }

  /** Delete a chat group (cascades to members and messages) */
  static async deleteGroup(chatGroupId: string) {
    return await prisma.chatGroup.delete({
      where: { id: chatGroupId },
      select: BaseSelectors.chatGroup,
    });
  }

  /** Find all groups a user is a member of */
  static async findUserGroups(userId: string) {
    return await prisma.chatGroup.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      select: BaseSelectors.chatGroupWithMembers,
      orderBy: { createdAt: "desc" },
    });
  }

  // Chat Member Operations

  /** Check if a user is a member of a group */
  static async isMember(userId: string, chatGroupId: string) {
    const member = await prisma.chatMember.findUnique({
      where: {
        userId_chatGroupId: {
          userId,
          chatGroupId,
        },
      },
    });

    return !!member;
  }

  /** Get a user's membership details in a group */
  static async getMembership(userId: string, chatGroupId: string) {
    return await prisma.chatMember.findUnique({
      where: {
        userId_chatGroupId: {
          userId,
          chatGroupId,
        },
      },
      select: BaseSelectors.chatMember,
    });
  }

  /** Add a user to a chat group */
  static async addMember(data: JoinChatGroupData) {
    return await prisma.chatMember.create({
      data: {
        userId: data.userId,
        chatGroupId: data.chatGroupId,
        role: data.role ?? "MEMBER",
      },
      select: BaseSelectors.chatMember,
    });
  }

  /** Remove a user from a chat group */
  static async removeMember(userId: string, chatGroupId: string) {
    return await prisma.chatMember.delete({
      where: {
        userId_chatGroupId: {
          userId,
          chatGroupId,
        },
      },
      select: BaseSelectors.chatMember,
    });
  }

  /** Update a member's role in a group */
  static async updateMemberRole(
    userId: string,
    chatGroupId: string,
    data: UpdateMemberRoleData
  ) {
    return await prisma.chatMember.update({
      where: {
        userId_chatGroupId: {
          userId,
          chatGroupId,
        },
      },
      data: {
        role: data.role,
      },
      select: BaseSelectors.chatMember,
    });
  }

  /** Get all members of a chat group */
  static async getGroupMembers(chatGroupId: string) {
    return await prisma.chatMember.findMany({
      where: { chatGroupId },
      select: BaseSelectors.chatMember,
      orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
    });
  }

  /** Count members in a group */
  static async countMembers(chatGroupId: string) {
    return await prisma.chatMember.count({
      where: { chatGroupId },
    });
  }

  // Chat Message Operations

  /** Send a message to a chat group */
  static async createMessage(data: SendMessageData) {
    return await prisma.chatMessage.create({
      data: {
        content: data.content,
        senderId: data.senderId,
        chatGroupId: data.chatGroupId,
      },
      select: BaseSelectors.chatMessage,
    });
  }

  /** Get messages with cursor-based pagination */
  static async getMessages(
    chatGroupId: string,
    pagination?: MessagePaginationCursor
  ) {
    const limit = pagination?.limit ?? 50;
    const cursor = pagination?.cursor;

    const messages = await prisma.chatMessage.findMany({
      where: { chatGroupId },
      select: BaseSelectors.chatMessage,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    });

    const result = processPaginatedResults(
      messages,
      pagination?.limit ?? 10,
      "id"
    );

    return result;
  }

  /** Find a message by ID */
  static async findMessageById(messageId: number) {
    return await prisma.chatMessage.findUnique({
      where: { id: messageId },
      select: {
        ...BaseSelectors.chatMessage,
        chatGroupId: true,
      },
    });
  }

  /** Delete a message */
  static async deleteMessage(messageId: number) {
    return await prisma.chatMessage.delete({
      where: { id: messageId },
      select: BaseSelectors.chatMessage,
    });
  }

  /** Get the latest message in a group */
  static async getLatestMessage(chatGroupId: string) {
    return await prisma.chatMessage.findFirst({
      where: { chatGroupId },
      select: BaseSelectors.chatMessage,
      orderBy: { createdAt: "desc" },
    });
  }
}

export default ChatRepository;
