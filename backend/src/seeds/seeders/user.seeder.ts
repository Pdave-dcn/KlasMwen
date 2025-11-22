/*eslint-disable max-lines-per-function*/
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";

import prisma from "../../core/config/db.js";
import env from "../../core/config/env.js";
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

    //
    // ──────────────────────────────────────────────
    //   1. ADMIN USER
    // ──────────────────────────────────────────────
    //
    const adminPassword = env.ADMIN_PASSWORD;
    const adminHashedPassword = await bcrypt.hash(adminPassword, 12);
    const adminAvatar = getRandomAvatar(avatars);

    const adminUser = await prisma.user.create({
      data: {
        username: env.ADMIN_USERNAME,
        email: env.ADMIN_EMAIL,
        password: adminHashedPassword,
        avatarId: adminAvatar.id,
        bio: "System Administrator",
        role: "ADMIN",
      },
    });

    logger.info(
      {
        email: adminUser.email,
        password: adminPassword,
        role: "ADMIN",
      },
      "Admin user created"
    );

    users.push(adminUser);

    //
    // ──────────────────────────────────────────────
    //   2. GUEST USER
    // ──────────────────────────────────────────────
    //
    const existingGuest = await prisma.user.findUnique({
      where: { email: env.GUEST_EMAIL },
    });

    if (!existingGuest) {
      const guestPassword = env.GUEST_PASSWORD;
      const guestHashedPassword = await bcrypt.hash(guestPassword, 12);
      const guestAvatar = getRandomAvatar(avatars);

      const guestUser = await prisma.user.create({
        data: {
          username: env.GUEST_USERNAME,
          email: env.GUEST_EMAIL,
          password: guestHashedPassword,
          avatarId: guestAvatar.id,
          bio: "Guest User — temporary demo account",
          role: "GUEST",
        },
      });

      logger.info(
        {
          email: guestUser.email,
          password: guestPassword,
          role: "GUEST",
        },
        "Guest user created"
      );

      users.push(guestUser);
    } else {
      logger.info(
        {
          email: existingGuest.email,
        },
        "Guest user already exists. Skipping."
      );
      users.push(existingGuest);
    }

    //
    // ──────────────────────────────────────────────
    //   3. GENERATE REGULAR SEED USERS
    // ──────────────────────────────────────────────
    //
    for (let i = 0; i < userCount; i++) {
      const password = faker.internet.password();
      const avatar = getRandomAvatar(avatars);

      const hashedPassword = await bcrypt.hash(password, 12);

      const user = await prisma.user.create({
        data: {
          username: faker.internet.username(),
          email: faker.internet.email(),
          password: hashedPassword,
          avatarId: avatar.id,
          bio: faker.lorem.paragraph(),
        },
      });

      // Log only first 3 regular users
      if (i < 3) {
        logger.info(
          {
            email: user.email,
            password,
          },
          "Seeded user credentials"
        );
      }

      users.push(user);
    }

    //
    // ──────────────────────────────────────────────
    //   4. METRICS
    // ──────────────────────────────────────────────
    //
    const metrics = calculateMetrics(userCreationStartTime, users.length);

    const userStats = {
      totalUsers: users.length,
      regularUsers: userCount,
      adminUsers: 1,
      guestUsers: 1,
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
