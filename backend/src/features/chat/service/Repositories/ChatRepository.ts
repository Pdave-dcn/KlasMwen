import prisma from "../../../../core/config/db.js";
import {
  BaseSelectors,
  type UpdateChatGroupData,
  type JoinChatGroupData,
  type UpdateMemberRoleData,
  type SendMessageData,
  type MessagePaginationCursor,
  type CreateChatGroupFinalData,
  type GroupPaginationCursor,
} from "../chatTypes.js";

class ChatRepository {
  //Chat Group Operations

  /** Find a single chat group by ID */
  static async findGroupById(chatGroupId: string) {
    return await prisma.chatGroup.findUnique({
      where: { id: chatGroupId },
      select: BaseSelectors.chatGroupWithMembers,
    });
  }

  static async getGroupDetails(chatGroupId: string) {
    return await prisma.chatGroup.findUnique({
      where: { id: chatGroupId },
      select: BaseSelectors.chatGroupPreviewDetail,
    });
  }

  /** Find public groups with cursor-based pagination, excluding groups the user is already a member of */
  static async findPublicGroups(
    userId: string,
    pagination: GroupPaginationCursor,
  ) {
    return await prisma.chatGroup.findMany({
      where: {
        isPrivate: false,
        members: {
          none: {
            userId,
          },
        },
      },
      select: BaseSelectors.chatGroupForDiscovery,
      orderBy: { createdAt: "desc" },
      take: pagination.limit + 1,
      ...(pagination.cursor && {
        cursor: { id: pagination.cursor },
        skip: 1,
      }),
    });
  }

  /** Find groups the user is in, ordered by the most recent message activity. */
  static async findRecentGroupsWithActivity(userId: string, limit: number = 8) {
    return await prisma.chatGroup.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      select: BaseSelectors.chatGroupWithMembers,
      orderBy: {
        messages: {
          _count: "desc",
        },
      },
      take: limit,
    });
  }

  /** Create a new chat group and add creator as owner */
  static async createGroup(data: CreateChatGroupFinalData) {
    return await prisma.chatGroup.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        isPrivate: data.isPrivate ?? false,
        creatorId: data.creatorId,
        avatarId: data.avatarId,
        members: {
          create: {
            userId: data.creatorId,
            role: "OWNER",
          },
        },
        chatGroupTags: {
          create:
            data.tagIds.map((tagId) => ({
              tagId,
            })) ?? [],
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
      select: {
        ...BaseSelectors.chatGroupWithMembers,
        members: {
          where: { userId },
          select: {
            lastReadAt: true,
          },
        },
      },
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

  /** Get multiple user memberships in a specific group*/
  static async getMemberships(userIds: string[], chatGroupId: string) {
    return await prisma.chatMember.findMany({
      where: {
        chatGroupId,
        userId: {
          in: userIds,
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
    data: UpdateMemberRoleData,
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

  /** find users sharing groups with a specific user */
  static async findAllContacts(userId: string) {
    const members = await prisma.chatMember.findMany({
      where: {
        chatGroupId: {
          in: await prisma.chatMember
            .findMany({
              where: { userId },
              select: { chatGroupId: true },
            })
            .then((groups) => groups.map((g) => g.chatGroupId)),
        },
        NOT: { userId },
      },
      select: { userId: true },
      distinct: ["userId"],
    });
    return members.map((m) => m.userId);
  }

  static async updateLastReadAt(userId: string, chatGroupId: string) {
    return await prisma.chatMember.update({
      where: { userId_chatGroupId: { userId, chatGroupId } },
      data: { lastReadAt: new Date() },
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
    pagination?: MessagePaginationCursor,
  ) {
    const limit = pagination?.limit ?? 50;
    const cursor = pagination?.cursor;

    return await prisma.chatMessage.findMany({
      where: { chatGroupId },
      select: BaseSelectors.chatMessage,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    });
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

  static async countUnreadMessages(chatGroupId: string, lastReadAt?: Date) {
    return await prisma.chatMessage.count({
      where: {
        chatGroupId,
        createdAt: lastReadAt ? { gt: lastReadAt } : undefined,
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

  // Statistics Operations

  static async getQuickStats(userId: string) {
    const [activeGroupsCount, unreadResult, studyPartnersCount] =
      await Promise.all([
        // Active Groups: Count groups user belongs to with activity in last 7 days
        prisma.chatGroup.count({
          where: {
            members: { some: { userId } },
            messages: {
              some: {
                createdAt: {
                  gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                },
              },
            },
          },
        }),

        // Unread Messages: Sum of messages since user's lastReadAt in each group
        prisma.chatMember.findMany({
          where: { userId },
          select: {
            chatGroupId: true,
            lastReadAt: true,
          },
        }),

        // Study Partners: Unique users who share at least one group with this user
        prisma.chatMember
          .findMany({
            where: {
              chatGroup: {
                members: { some: { userId } },
              },
              NOT: { userId },
            },
            distinct: ["userId"],
            select: { userId: true },
          })
          .then((results) => results.length),
      ]);

    // For Unread calculation (Step 2 follow-up)
    let totalUnread = 0;
    for (const membership of unreadResult) {
      const count = await prisma.chatMessage.count({
        where: {
          chatGroupId: membership.chatGroupId,
          createdAt: { gt: membership.lastReadAt ?? new Date(0) },
          NOT: { senderId: userId },
        },
      });
      totalUnread += count;
    }

    return {
      activeGroups: activeGroupsCount,
      unreadMessages: totalUnread,
      studyPartners: studyPartnersCount,
    };
  }
}

export default ChatRepository;
