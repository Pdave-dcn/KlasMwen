import { faker } from "@faker-js/faker";

import prisma from "../../core/config/db";
import { createLogger } from "../../core/config/logger";
import { handleSeedingError } from "../utils/seedHelpers";

import type { Prisma } from "@prisma/client";

const logger = createLogger({ module: "AvatarSeeder" });

/**
 * Seeds the database with a specified number of default and non-default avatars.
 * The default avatars are simple identicons, while the non-default ones are more unique,
 * randomly generated adventurer-style avatars.
 *
 * @param {number} [nonDefaultCount=90] The number of non-default avatars to create.
 * @param {number} [defaultCount=10] The number of default identicon avatars to create.
 * @return {Promise<import('@prisma/client').Avatar[]>} An array of all avatar objects from the database after seeding.
 */
const seedAvatars = async (nonDefaultCount = 90, defaultCount = 10) => {
  try {
    logger.info(`Starting avatar seeding process`);
    const startTime = Date.now();

    const avatarsData: Prisma.AvatarCreateInput[] = [];

    const backgroundColors = [
      "FF6B6B", // lively coral red
      "FFD93D", // bright yellow
      "6BCB77", // fresh green
      "4D96FF", // vivid blue
      "843BFF", // playful purple
      "FF8FAB", // bubblegum pink
      "00C49A", // turquoise
      "FFB84C", // tangerine
    ];

    logger.debug(`Generating ${defaultCount} default avatars`);
    for (let i = 0; i < defaultCount; i++) {
      const seed = faker.string.uuid();
      const url = `https://api.dicebear.com/9.x/identicon/svg?seed=${seed}&backgroundColor=${backgroundColors.join(
        ","
      )}`;
      avatarsData.push({
        url,
        isDefault: true,
      });
    }

    logger.debug(`Generating ${nonDefaultCount} non-default avatars`);
    for (let i = 0; i < nonDefaultCount; i++) {
      const seed = faker.string.uuid();
      const url = `https://api.dicebear.com/9.x/adventurer/svg?seed=${seed}&flip=true&size=100&scale=120&backgroundColor=${backgroundColors.join(
        ","
      )}`;
      avatarsData.push({
        url,
      });
    }

    logger.info(`Inserting ${avatarsData.length} avatars into the database`);
    const avatars = await prisma.avatar.createManyAndReturn({
      data: avatarsData,
      skipDuplicates: true,
    });

    const avatarCreationDuration = Date.now() - startTime;

    const avatarStats = {
      totalAvatarsCreated: avatars.length,
      avatarCreationDuration,
      avatarDistribution: {
        defaultCount,
        nonDefaultCount,
      },
    };

    logger.info(avatarStats, "Avatar seeding completed successfully");

    return { avatars, avatarStats };
  } catch (error) {
    return handleSeedingError(error, logger, "Avatar seeding", "avatars", {
      defaultCount,
      nonDefaultCount,
    });
  }
};

export default seedAvatars;
