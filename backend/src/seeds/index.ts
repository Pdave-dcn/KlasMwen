/*eslint-disable max-lines-per-function*/
import prisma from "../core/config/db.js";
import { createLogger } from "../core/config/logger.js";
import SeedingError from "../core/error/custom/seed.error.js";

import seedAvatars from "./seeders/avatar.seeder.js";
import cleanupDatabase from "./seeders/cleanup.seeder.js";
import seedComments from "./seeders/comment.seeder.js";
import seedLikes from "./seeders/like.seeder.js";
import seedPosts from "./seeders/post.seeder.js";
import seedTags from "./seeders/tag.seeder.js";
import seedUsers from "./seeders/user.seeder.js";

const logger = createLogger({ module: "DatabaseSeeder" });

const main = async () => {
  logger.info("Database seeding process initiated");
  const seedingStartTime = Date.now();

  try {
    // Phase 1: Cleanup existing data
    const cleanupStats = await cleanupDatabase();

    // Phase 2: Create tags
    const { tags, tagStats } = await seedTags();

    // phase 3: Create avatars
    const { avatars, avatarStats } = await seedAvatars();

    // Phase 4: Create users
    if (!avatars) return;
    const { users, userStats } = await seedUsers(10, avatars);

    // Phase 5: Create posts
    if (!users || !tags) return;
    const { posts, postStats } = await seedPosts(users, tags, 5);

    // phase 6: Create comments
    if (!posts) return;
    const commentStats = await seedComments(users, posts);

    // phase 7: Create likes
    const likeStats = await seedLikes(users, posts);

    const totalSeedingDuration = Date.now() - seedingStartTime;

    logger.info(
      {
        summary: {
          totalUsers: users.length,
          totalPosts: postStats.totalPosts,
          postTypeDistribution: postStats.postTypeDistribution,
          totalComments: commentStats.totalComments,
          commentsDistribution: commentStats.commentDistribution,
          totalTags: tagStats.tagsCreated,
          totalLikes: likeStats.totalLikes,
          likesDistribution: likeStats.distribution,
          totalAvatars: avatarStats.totalAvatarsCreated,
          avatarsDistribution: avatarStats.avatarDistribution,
        },
        phases: {
          cleanupDuration: cleanupStats.cleanupDuration,
          tagCreationDuration: tagStats.tagCreationDuration,
          avatarCreationDuration: avatarStats.avatarCreationDuration,
          userCreationDuration: userStats.userCreationDuration,
          postCreationDuration: postStats.postCreationDuration,
          commentCreationDuration: commentStats.commentCreationDuration,
          likeCreationDuration: likeStats.likeSeedingDuration,
        },
        totalSeedingDuration,
      },
      "Database seeding completed successfully"
    );
  } catch (error) {
    const failureDuration = Date.now() - seedingStartTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (error instanceof SeedingError) {
      logger.error(
        {
          ...error.toJSON(),
          failureDuration,
        },
        `Database seeding failed in ${error.phase ?? "unknown"} phase`
      );
    } else {
      logger.error(
        {
          error: errorMessage,
          errorType:
            error instanceof Error ? error.constructor.name : typeof error,
          failureDuration,
        },
        "Database seeding failed with unexpected error"
      );
    }

    throw new SeedingError(
      `Seeding process failed`,
      error instanceof SeedingError ? error.phase : "main",
      {
        failureDuration,
        originalError: errorMessage,
      }
    );
  }
};

// Execute the main seeding function
main()
  .catch((e) => {
    logger.error(
      {
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
      },
      "Fatal error during seeding process"
    );
    throw new Error("Database seeding failed");
  })
  .finally(async () => {
    logger.info("Closing database connection");
    await prisma.$disconnect();
    logger.info("Database connection closed");
  });
