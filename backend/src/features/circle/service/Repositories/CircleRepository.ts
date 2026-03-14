import prisma from "../../../../core/config/db.js";
import {
  BaseSelectors,
  type UpdateCircleData,
  type JoinCircleData,
  type UpdateMemberRoleData,
  type SendMessageData,
  type MessagePaginationCursor,
  type CreateCircleFinalData,
  type CirclePaginationCursor,
} from "../CircleTypes.js";

class CircleRepository {
  //Circle Operations

  /** Find a single circle by ID */
  static async findCircleById(circleId: string) {
    return await prisma.circle.findUnique({
      where: { id: circleId },
      select: BaseSelectors.circleWithMembersAndLatestMsg,
    });
  }

  static async getCircleDetails(circleId: string) {
    return await prisma.circle.findUnique({
      where: { id: circleId },
      select: BaseSelectors.circlePreviewDetail,
    });
  }

  /** Find public circles with cursor-based pagination, excluding groups the user is already a member of */
  static async findPublicCircles(
    userId: string,
    pagination: CirclePaginationCursor,
  ) {
    return await prisma.circle.findMany({
      where: {
        isPrivate: false,
        members: {
          none: {
            userId,
          },
        },
      },
      select: BaseSelectors.circleForDiscovery,
      orderBy: { createdAt: "desc" },
      take: pagination.limit + 1,
      ...(pagination.cursor && {
        cursor: { id: pagination.cursor },
        skip: 1,
      }),
    });
  }

  /** Find circles the user is in, ordered by the most recent message activity. */
  static async findRecentCirclesWithActivity(
    userId: string,
    limit: number = 8,
  ) {
    return await prisma.circle.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      select: BaseSelectors.circleWithMembersAndLatestMsg,
      orderBy: {
        messages: {
          _count: "desc",
        },
      },
      take: limit,
    });
  }

  /** Create a new circle and add creator as owner */
  static async createCircle(data: CreateCircleFinalData) {
    return await prisma.circle.create({
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
        circleTags: {
          create:
            data.tagIds.map((tagId) => ({
              tagId,
            })) ?? [],
        },
      },
      select: BaseSelectors.circleWithMembersAndLatestMsg,
    });
  }

  /** Update circle details */
  static async updateCircle(circleId: string, data: UpdateCircleData) {
    return await prisma.circle.update({
      where: { id: circleId },
      data: {
        name: data.name,
        description: data.description,
        isPrivate: data.isPrivate,
      },
      select: BaseSelectors.circleWithMembersAndLatestMsg,
    });
  }

  /** Delete a circle (cascades to members and messages) */
  static async deleteCircle(circleId: string) {
    return await prisma.circle.delete({
      where: { id: circleId },
      select: BaseSelectors.circle,
    });
  }

  /** Find all circles a user is a member of */
  static async findUserCircles(userId: string) {
    return await prisma.circle.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      select: BaseSelectors.circleWithMembersAndLatestMsg,
      orderBy: { createdAt: "desc" },
    });
  }

  // Circle Member Operations

  /** Check if a user is a member of a circle */
  static async isMember(userId: string, circleId: string) {
    const member = await prisma.circleMember.findUnique({
      where: {
        userId_circleId: {
          userId,
          circleId,
        },
      },
    });

    return !!member;
  }

  /** Get a user's membership details in a circle */
  static async getMembership(userId: string, circleId: string) {
    return await prisma.circleMember.findUnique({
      where: {
        userId_circleId: {
          userId,
          circleId,
        },
      },
      select: BaseSelectors.circleMember,
    });
  }

  /** Get multiple user memberships in a specific circle*/
  static async getMemberships(userIds: string[], circleId: string) {
    return await prisma.circleMember.findMany({
      where: {
        circleId,
        userId: {
          in: userIds,
        },
      },
      select: BaseSelectors.circleMember,
    });
  }

  /** Mute a member until a given date, or unmute by passing null */
  static async setMemberMute(
    userId: string,
    circleId: string,
    mutedUntil: Date | null,
  ) {
    return await prisma.circleMember.update({
      where: {
        userId_circleId: {
          userId,
          circleId,
        },
      },
      data: { mutedUntil },
      select: BaseSelectors.circleMember,
    });
  }

  /** Add a user to a circle */
  static async addMember(data: JoinCircleData) {
    return await prisma.circleMember.create({
      data: {
        userId: data.userId,
        circleId: data.circleId,
        role: data.role ?? "MEMBER",
      },
      select: BaseSelectors.circleMember,
    });
  }

  /** Remove a user from a circle */
  static async removeMember(userId: string, circleId: string) {
    return await prisma.circleMember.delete({
      where: {
        userId_circleId: {
          userId,
          circleId,
        },
      },
      select: BaseSelectors.circleMember,
    });
  }

  /** Update a member's role in a circle */
  static async updateMemberRole(
    userId: string,
    circleId: string,
    data: UpdateMemberRoleData,
  ) {
    return await prisma.circleMember.update({
      where: {
        userId_circleId: {
          userId,
          circleId,
        },
      },
      data: {
        role: data.role,
      },
      select: BaseSelectors.circleMember,
    });
  }

  /** Get all members of a circle */
  static async getGroupMembers(circleId: string) {
    return await prisma.circleMember.findMany({
      where: { circleId },
      select: BaseSelectors.circleMember,
      orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
    });
  }

  /** Count members in a circle */
  static async countMembers(circleId: string) {
    return await prisma.circleMember.count({
      where: { circleId },
    });
  }

  /** find users sharing circles with a specific user */
  static async findAllContacts(userId: string) {
    const members = await prisma.circleMember.findMany({
      where: {
        circle: {
          members: { some: { userId } },
        },
        NOT: { userId },
      },
      select: { userId: true },
      distinct: ["userId"],
    });
    return members.map((m) => m.userId);
  }

  static async updateLastReadAt(userId: string, circleId: string) {
    return await prisma.circleMember.update({
      where: { userId_circleId: { userId, circleId } },
      data: { lastReadAt: new Date() },
    });
  }

  // Circle Message Operations

  /** Send a message to a circle */
  static async createMessage(data: SendMessageData) {
    return await prisma.circleMessage.create({
      data: {
        content: data.content,
        senderId: data.senderId,
        circleId: data.circleId,
      },
      select: BaseSelectors.circleMessage,
    });
  }

  /** Get messages with cursor-based pagination */
  static async getMessages(
    circleId: string,
    pagination?: MessagePaginationCursor,
  ) {
    const limit = pagination?.limit ?? 50;
    const cursor = pagination?.cursor;

    return await prisma.circleMessage.findMany({
      where: { circleId },
      select: BaseSelectors.circleMessage,
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
    return await prisma.circleMessage.findUnique({
      where: { id: messageId },
      select: {
        ...BaseSelectors.circleMessage,
        circleId: true,
      },
    });
  }

  static async countUnreadMessagesBatch(userId: string) {
    const rows = await prisma.$queryRaw<{ circle_id: string; count: bigint }[]>`
    SELECT cm.circle_id, COUNT(msg.id) as count
    FROM circle_members cm
    LEFT JOIN circle_messages msg
      ON msg.circle_id = cm.circle_id
      AND msg.sender_id != ${userId}
      AND msg.created_at > COALESCE(cm.last_read_at, '1970-01-01')
    WHERE cm.user_id = ${userId}
    GROUP BY cm.circle_id
  `;

    return Object.fromEntries(rows.map((r) => [r.circle_id, Number(r.count)]));
  }

  static async countUnreadMessages(
    circleId: string,
    userId: string,
    lastReadAt?: Date,
  ) {
    return await prisma.circleMessage.count({
      where: {
        circleId,
        NOT: { senderId: userId },
        createdAt: { gt: lastReadAt ?? new Date(0) },
      },
    });
  }

  /** Delete a message */
  static async deleteMessage(messageId: number) {
    return await prisma.circleMessage.delete({
      where: { id: messageId },
      select: BaseSelectors.circleMessage,
    });
  }

  /** Get the latest message in a circle */
  static async getLatestMessage(circleId: string) {
    return await prisma.circleMessage.findFirst({
      where: { circleId },
      select: BaseSelectors.circleMessage,
      orderBy: { createdAt: "desc" },
    });
  }

  // Statistics Operations

  static async getQuickStats(userId: string) {
    const [activeGroupsCount, memberships, studyPartnersCount, unreadBatch] =
      await Promise.all([
        prisma.circle.count({
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

        prisma.circleMember.findMany({
          where: { userId },
          select: { circleId: true },
        }),

        prisma.circleMember
          .findMany({
            where: {
              circle: { members: { some: { userId } } },
              NOT: { userId },
            },
            distinct: ["userId"],
            select: { userId: true },
          })
          .then((r) => r.length),

        this.countUnreadMessagesBatch(userId),
      ]);

    const totalUnread = memberships.reduce(
      (sum, { circleId }) => sum + (unreadBatch[circleId] ?? 0),
      0,
    );

    return {
      activeGroups: activeGroupsCount,
      unreadMessages: totalUnread,
      studyPartners: studyPartnersCount,
    };
  }
}

export default CircleRepository;
