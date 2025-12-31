/*eslint-disable max-lines-per-function*/
import { faker } from "@faker-js/faker";

import prisma from "../../core/config/db.js";
import { createLogger } from "../../core/config/logger.js";
import {
  getRandomTags,
  generateResourceData,
  calculateMetrics,
  handleSeedingError,
} from "../utils/seedHelpers.js";

import type { Tag, User } from "@prisma/client";

const logger = createLogger({ module: "PostSeeder" });

/**
 * Create posts for users with randomized order
 * @param {Array} users - Array of user objects
 * @param {Array} tags - Array of tag objects
 * @param {number} postsPerUser - Number of posts to create per user
 * @returns {Promise<Object>} Post creation statistics
 */
const seedPosts = async (users: User[], tags: Tag[], postsPerUser = 5) => {
  logger.info("Post creation phase started");
  const postCreationStartTime = Date.now();

  try {
    let totalPostsCreated = 0;
    const postTypeStats = { QUESTION: 0, NOTE: 0, RESOURCE: 0 };
    const postTypes = ["QUESTION", "NOTE", "RESOURCE"] as const;
    const userPostStats = new Map(
      users.map((user) => [user.id, { QUESTION: 0, NOTE: 0, RESOURCE: 0 }])
    );

    // Generate all post creation tasks upfront
    const postCreationTasks = users.flatMap((user) =>
      Array.from({ length: postsPerUser }, () => ({
        user,
        type: faker.helpers.arrayElement(postTypes),
      }))
    );

    // Shuffle the tasks to randomize creation order
    const shuffledTasks = faker.helpers.shuffle(postCreationTasks);

    logger.debug(
      { totalTasks: shuffledTasks.length },
      "Post creation tasks shuffled"
    );

    // Create posts in randomized order
    for (const [index, { user, type }] of shuffledTasks.entries()) {
      const userStats = userPostStats.get(user.id);
      if (userStats) {
        userStats[type]++;
      }
      postTypeStats[type]++;

      // Base post data
      const postData = {
        title:
          type === "QUESTION"
            ? `${faker.lorem.sentence().replace(/\.$/, "")}??`
            : faker.lorem.sentence(),
        content:
          type === "RESOURCE"
            ? null
            : type === "QUESTION"
            ? faker.lorem.paragraphs()
            : faker.lorem.paragraphs({ min: 7, max: 10 }),
        authorId: user.id,
        type,
        isMock: true,
        hidden: faker.datatype.boolean({ probability: 0.15 }) ? true : false,
      };

      if (type === "RESOURCE") {
        Object.assign(postData, generateResourceData());
      }

      const post = await prisma.post.create({ data: postData });

      const randomTags = getRandomTags(tags);
      await prisma.postTag.createMany({
        data: randomTags.map((tag) => ({
          postId: post.id,
          tagId: tag.id,
        })),
      });

      totalPostsCreated++;

      // Progress log every 10 posts
      if (totalPostsCreated % 10 === 0) {
        logger.debug(
          {
            totalPostsCreated,
            postId: post.id,
            type,
            userId: user.id,
            progress: `${(((index + 1) / shuffledTasks.length) * 100).toFixed(
              1
            )}%`,
          },
          `Progress: created ${totalPostsCreated} posts`
        );
      }
    }

    // Log per-user statistics
    for (const user of users) {
      const stats = userPostStats.get(user.id);
      logger.info(
        {
          userId: user.id,
          username: user.username,
          postsCreated: postsPerUser,
          distribution: stats,
        },
        "Post creation summary for user"
      );
    }

    const posts = await prisma.post.findMany();

    const metrics = calculateMetrics(postCreationStartTime, totalPostsCreated);
    const postStats = {
      totalUsers: users.length,
      totalPosts: totalPostsCreated,
      postsPerUser,
      totalTags: tags.length,
      postTypeDistribution: postTypeStats,
      averagePostCreationTime: metrics.averageTime,
      postCreationDuration: metrics.duration,
    };

    logger.info(postStats, "Post creation phase completed");

    return { posts, postStats };
  } catch (error) {
    return handleSeedingError(error, logger, "Post seeding failed", "posts");
  }
};

export default seedPosts;
