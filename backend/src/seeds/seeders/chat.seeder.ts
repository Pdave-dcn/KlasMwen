/* eslint-disable max-lines-per-function */
import { faker } from "@faker-js/faker";

import prisma from "../../core/config/db.js";
import { createLogger } from "../../core/config/logger.js";
import { calculateMetrics, handleSeedingError } from "../utils/seedHelpers.js";

import type { User, Prisma } from "@prisma/client";

const logger = createLogger({ module: "ChatSeeder" });

const seedChats = async (users: User[], groupCount = 5) => {
  try {
    logger.info("Chat creation phase started");
    const chatCreationStartTime = Date.now();

    // 1. Create Chat Groups
    const chatGroups = [];
    for (let i = 0; i < groupCount; i++) {
      const creator = faker.helpers.arrayElement(users);
      const group = await prisma.chatGroup.create({
        data: {
          name: faker.company.catchPhrase(),
          description: faker.lorem.sentence(),
          isPrivate: faker.datatype.boolean(),
          creatorId: creator.id,
        },
      });
      chatGroups.push(group);
    }

    // 2. Create Chat Members
    // Ensure the creator is always an OWNER, and add random members
    const allMembersData: Prisma.ChatMemberUncheckedCreateInput[] = [];

    for (const group of chatGroups) {
      // Add the creator as OWNER
      allMembersData.push({
        chatGroupId: group.id,
        userId: group.creatorId,
        role: "OWNER",
      });

      // Pick random additional members (excluding the creator)
      const potentialMembers = users.filter((u) => u.id !== group.creatorId);
      const groupSize = faker.number.int({ min: 3, max: 10 });
      const selectedMembers = faker.helpers.arrayElements(
        potentialMembers,
        groupSize,
      );

      selectedMembers.forEach((member) => {
        allMembersData.push({
          chatGroupId: group.id,
          userId: member.id,
          role: faker.helpers.arrayElement(["MODERATOR", "MEMBER", "MEMBER"]),
        });
      });
    }

    await prisma.chatMember.createMany({ data: allMembersData });

    // 3. Create Chat Messages
    const messagesData: Prisma.ChatMessageUncheckedCreateInput[] = [];

    for (const group of chatGroups) {
      // Get member IDs for this specific group to ensure only members send messages
      const groupMemberIds = allMembersData
        .filter((m) => m.chatGroupId === group.id)
        .map((m) => m.userId);

      const messageCount = faker.number.int({ min: 10, max: 30 });

      for (let i = 0; i < messageCount; i++) {
        messagesData.push({
          content: faker.lorem.sentence(),
          chatGroupId: group.id,
          senderId: faker.helpers.arrayElement(groupMemberIds),
          createdAt: faker.date.recent({ days: 7 }),
        });
      }
    }

    // Sort messages by date so the index [chatGroupId, createdAt] is happy
    messagesData.sort(
      (a, b) =>
        (a.createdAt as Date).getTime() - (b.createdAt as Date).getTime(),
    );

    await prisma.chatMessage.createMany({ data: messagesData });

    const metrics = calculateMetrics(
      chatCreationStartTime,
      messagesData.length,
    );

    const chatStats = {
      totalGroups: chatGroups.length,
      totalMemberships: allMembersData.length,
      totalMessages: messagesData.length,
      chatCreationDuration: metrics.duration,
    };

    logger.info(chatStats, "Chat creation phase completed");
    return { chatGroups, chatStats };
  } catch (error) {
    return handleSeedingError(error, logger, "Chat creation", "chats", {
      userCount: users.length,
    });
  }
};

export default seedChats;
