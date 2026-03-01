import { faker } from "@faker-js/faker";

import prisma from "../../core/config/db.js";
import { createLogger } from "../../core/config/logger.js";
import { handleSeedingError } from "../utils/seedHelpers.js";

import type { Prisma } from "@prisma/client";

const logger = createLogger({ module: "ChatGroupAvatarSeeder" });

/**
 * Seeds the database with a specified number of circle avatars.
 * The avatars use the shapes style from DiceBear API for a clean,
 * geometric appearance suitable for group identities.
 *
 * @param {number} [count=50] The number of circle avatars to create.
 * @return {Promise<import('@prisma/client').CircleAvatar[]>} An array of all circle avatar objects from the database after seeding.
 */
const seedCircleAvatars = async (count = 50) => {
  try {
    logger.info(`Starting circle avatar seeding process`);
    const startTime = Date.now();

    const avatarsData: Prisma.CircleAvatarCreateInput[] = [];

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

    logger.debug(`Generating ${count} chat group avatars`);
    for (let i = 0; i < count; i++) {
      const seed = faker.string.uuid();
      const url = `https://api.dicebear.com/9.x/shapes/svg?seed=${seed}&backgroundColor=${backgroundColors.join(
        ",",
      )}`;
      avatarsData.push({
        url,
      });
    }

    logger.info(
      `Inserting ${avatarsData.length} circle avatars into the database`,
    );
    const circleAvatars = await prisma.circleAvatar.createManyAndReturn({
      data: avatarsData,
      skipDuplicates: true,
    });

    const avatarCreationDuration = Date.now() - startTime;

    const circleAvatarStats = {
      totalAvatarsCreated: circleAvatars.length,
      avatarCreationDuration,
    };

    logger.info(
      circleAvatarStats,
      "Circle avatar seeding completed successfully",
    );

    return { circleAvatars, circleAvatarStats };
  } catch (error) {
    return handleSeedingError(
      error,
      logger,
      "Circle avatar seeding",
      "circle_avatars",
      {
        count,
      },
    );
  }
};

export default seedCircleAvatars;
