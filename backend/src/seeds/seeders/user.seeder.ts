/*eslint-disable max-lines-per-function*/
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";

import prisma from "../../core/config/db.js";
import { createLogger } from "../../core/config/logger.js";
import {
  calculateMetrics,
  getRandomAvatar,
  handleSeedingError,
} from "../utils/seedHelpers.js";

import type { Avatar } from "@prisma/client";

const logger = createLogger({ module: "UserSeeder" });

/**
 * Create test users in the database
 * @param {number} userCount - Number of users to create
 * @returns {Promise<Object>} Created users and statistics
 */
const seedUsers = async (userCount = 10, avatars: Avatar[]) => {
  logger.info("User creation phase started");
  const userCreationStartTime = Date.now();

  try {
    const users = [];

    for (let i = 0; i < userCount; i++) {
      const userStartTime = Date.now();
      const password = faker.internet.password();
      const avatar = getRandomAvatar(avatars);

      // hash password
      const hashStartTime = Date.now();
      const hashedPassword = await bcrypt.hash(password, 12);
      const hashDuration = Date.now() - hashStartTime;

      // create user
      const dbCreateStartTime = Date.now();
      const user = await prisma.user.create({
        data: {
          username: faker.internet.username(),
          email: faker.internet.email(),
          password: hashedPassword,
          avatarId: avatar.id,
        },
      });
      const dbCreateDuration = Date.now() - dbCreateStartTime;

      logger.info(
        {
          email: user.email,
          password,
        },
        "Seeded user credentials"
      );

      users.push(user);

      const userTotalDuration = Date.now() - userStartTime;

      // Detailed log only in debug mode
      logger.debug(
        {
          userIndex: i + 1,
          userId: user.id,
          username: user.username,
          email: user.email,
          avatarId: user.avatarId,
          hashDuration,
          dbCreateDuration,
          userTotalDuration,
        },
        "User created successfully"
      );

      // Progress log every 10 users
      if ((i + 1) % 10 === 0) {
        logger.info(
          {
            createdUsers: i + 1,
            lastUserId: user.id,
            lastUsername: user.username,
          },
          `Progress: ${i + 1}/${userCount} users created`
        );
      }
    }

    const metrics = calculateMetrics(userCreationStartTime, users.length);

    const userStats = {
      totalUsers: users.length,
      averageUserCreationTime: metrics.averageTime,
      userCreationDuration: metrics.duration,
    };

    logger.info(userStats, "User creation phase completed");

    return { users, userStats };
  } catch (error) {
    return handleSeedingError(error, logger, "User creation", "users", {
      userCount,
    });
  }
};

export default seedUsers;
