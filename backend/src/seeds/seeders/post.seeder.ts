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
 * Create posts for users
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

    for (const [userIndex, user] of users.entries()) {
      const userPostsStartTime = Date.now();
      const userPostStats = { QUESTION: 0, NOTE: 0, RESOURCE: 0 };

      logger.debug(
        { userId: user.id, username: user.username, userIndex: userIndex + 1 },
        "Starting post creation for user"
      );

      for (let i = 0; i < postsPerUser; i++) {
        const randomType = faker.helpers.arrayElement(postTypes);
        userPostStats[randomType]++;
        postTypeStats[randomType]++;

        // Base post data
        const postData = {
          title:
            randomType === "QUESTION"
              ? `${faker.lorem.sentence().replace(/\.$/, "")}??`
              : faker.lorem.sentence(),
          content: randomType === "RESOURCE" ? null : faker.lorem.paragraphs(),
          authorId: user.id,
          type: randomType,
        };

        if (randomType === "RESOURCE") {
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
              type: randomType,
              userId: user.id,
            },
            `Progress: created ${totalPostsCreated} posts`
          );
        }
      }

      const userPostsDuration = Date.now() - userPostsStartTime;
      logger.info(
        {
          userId: user.id,
          username: user.username,
          postsCreated: postsPerUser,
          distribution: userPostStats,
          userPostsDuration,
        },
        "Completed post creation for user"
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
