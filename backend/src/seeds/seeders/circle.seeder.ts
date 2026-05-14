/* eslint-disable max-lines-per-function */
import { faker } from "@faker-js/faker";

import prisma from "../../core/config/db.js";
import { createLogger } from "../../core/config/logger.js";
import {
  calculateMetrics,
  getRandomAvatar,
  getRandomTags,
  handleSeedingError,
} from "../utils/seedHelpers.js";

import type { User, Prisma, CircleAvatar, Tag } from "@prisma/client";

const logger = createLogger({ module: "CircleSeeder" });

const seedCircles = async (
  users: User[],
  circleAvatars: CircleAvatar[],
  tags: Tag[],
  circleCount = 5,
) => {
  try {
    logger.info("Circle creation phase started");
    const circleCreationStartTime = Date.now();

    // 1. Create circles
    const circles = [];
    for (let i = 0; i < circleCount; i++) {
      const avatar = getRandomAvatar(circleAvatars);
      const creator = faker.helpers.arrayElement(users);
      const group = await prisma.circle.create({
        data: {
          name: faker.company.catchPhrase(),
          description: faker.lorem.sentence(),
          isPrivate: faker.datatype.boolean(),
          creatorId: creator.id,
          avatarId: avatar.id,
        },
      });
      circles.push(group);

      // Assign random tags to this chat group
      const randomTags = getRandomTags(tags);
      await prisma.circleTag.createMany({
        data: randomTags.map((tag) => ({
          circleId: group.id,
          tagId: tag.id,
        })),
      });
    }

    // 2. Create Circle Members
    // Ensure the creator is always an OWNER, and add random members
    const allMembersData: Prisma.CircleMemberUncheckedCreateInput[] = [];

    for (const group of circles) {
      // Add the creator as OWNER
      allMembersData.push({
        circleId: group.id,
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
          circleId: group.id,
          userId: member.id,
          role: faker.helpers.arrayElement(["MODERATOR", "MEMBER", "MEMBER"]),
        });
      });
    }

    await prisma.circleMember.createMany({ data: allMembersData });

    // 3. Create Circle Messages
    const messagesData: Prisma.CircleMessageUncheckedCreateInput[] = [];

    for (const group of circles) {
      // Get member IDs for this specific circle to ensure only members send messages
      const groupMemberIds = allMembersData
        .filter((m) => m.circleId === group.id)
        .map((m) => m.userId);

      const messageCount = faker.number.int({ min: 10, max: 30 });

      for (let i = 0; i < messageCount; i++) {
        messagesData.push({
          content: faker.lorem.sentence(),
          circleId: group.id,
          senderId: faker.helpers.arrayElement(groupMemberIds),
          createdAt: faker.date.recent({ days: 7 }),
        });
      }
    }

    // Sort messages by date so the index [circleId, createdAt] is happy
    messagesData.sort(
      (a, b) =>
        (a.createdAt as Date).getTime() - (b.createdAt as Date).getTime(),
    );

    await prisma.circleMessage.createMany({ data: messagesData });

    const metrics = calculateMetrics(
      circleCreationStartTime,
      messagesData.length,
    );

    const circleStats = {
      totalCircles: circles.length,
      totalMemberships: allMembersData.length,
      totalMessages: messagesData.length,
      totalTags: tags.length,
      circleCreationDuration: metrics.duration,
    };

    logger.info(circleStats, "Circle creation phase completed");
    return { circles, circleStats };
  } catch (error) {
    return handleSeedingError(error, logger, "Circle creation", "circles", {
      userCount: users.length,
    });
  }
};

export default seedCircles;
