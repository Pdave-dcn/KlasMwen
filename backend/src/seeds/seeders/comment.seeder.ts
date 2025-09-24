/* eslint-disable max-lines-per-function */
import { faker } from "@faker-js/faker";

import prisma from "../../core/config/db";
import { createLogger } from "../../core/config/logger";
import { calculateMetrics, handleSeedingError } from "../utils/seedHelpers";

import type { Post, Prisma, User } from "@prisma/client";

const logger = createLogger({ module: "CommentSeeder" });

/**
 * Create comments for posts with nested reply structure
 * @param {User[]} users - Array of user objects
 * @param {Post[]} posts - Array of post objects
 * @returns {Promise<CommentStats>} Comment creation statistics
 */
const seedComments = async (users: User[], posts: Post[]) => {
  try {
    logger.info("Comment creation phase started");
    const commentCreationStartTime = Date.now();

    // Phase 1: Create root comments
    logger.debug("Creating root comments");
    const rootCommentsData: Prisma.CommentUncheckedCreateInput[] = [];

    for (const post of posts) {
      const commentCount = faker.number.int({ min: 0, max: 15 });

      for (let i = 0; i < commentCount; i++) {
        rootCommentsData.push({
          content: faker.lorem.sentences(faker.number.int({ min: 1, max: 5 })),
          postId: post.id,
          authorId: faker.helpers.arrayElement(users).id,
        });
      }
    }

    const rootComments = await prisma.comment.createManyAndReturn({
      data: rootCommentsData,
    });
    logger.info(
      {
        rootCommentsCreated: rootComments.length,
        postsProcessed: posts.length,
      },
      "Root comments created successfully"
    );

    // Phase 2: Create first-level replies
    logger.debug("Creating first-level replies");
    const commentsEligibleForReplies = rootComments.filter(() =>
      faker.datatype.boolean({ probability: 0.3 })
    );

    const firstLevelRepliesData: Prisma.CommentUncheckedCreateInput[] = [];

    for (const parentComment of commentsEligibleForReplies) {
      const replyCount = faker.number.int({ min: 1, max: 4 });

      for (let i = 0; i < replyCount; i++) {
        firstLevelRepliesData.push({
          content: faker.lorem.sentences(faker.number.int({ min: 1, max: 2 })),
          postId: parentComment.postId,
          authorId: faker.helpers.arrayElement(users).id,
          parentId: parentComment.id,
        });
      }
    }

    const firstLevelReplies = await prisma.comment.createManyAndReturn({
      data: firstLevelRepliesData,
    });

    logger.info(
      {
        firstLevelRepliesCreated: firstLevelReplies.length,
        parentCommentsWithReplies: commentsEligibleForReplies.length,
      },
      "First-level replies created successfully"
    );

    // Phase 3: Create deep replies (replies to replies)
    logger.debug("Creating deep replies");
    const deepRepliesEligible = firstLevelReplies.filter(() =>
      faker.datatype.boolean({ probability: 0.15 })
    );

    const deepRepliesData: Prisma.CommentUncheckedCreateInput[] = [];

    for (const reply of deepRepliesEligible) {
      const deepReplyCount = faker.number.int({ min: 1, max: 2 });

      for (let i = 0; i < deepReplyCount; i++) {
        deepRepliesData.push({
          content: faker.lorem.sentences(faker.number.int({ min: 1, max: 2 })),
          postId: reply.postId,
          authorId: faker.helpers.arrayElement(users).id,
          parentId: reply.id,
        });
      }
    }

    const deepReplies = await prisma.comment.createManyAndReturn({
      data: deepRepliesData,
    });

    logger.info(
      {
        deepRepliesCreated: deepReplies.length,
        firstLevelRepliesWithDeepReplies: deepRepliesEligible.length,
      },
      "Deep replies created successfully"
    );

    const metrics = calculateMetrics(
      commentCreationStartTime,
      rootComments.length + firstLevelReplies.length + deepReplies.length
    );

    const postsWithComments = posts.filter((post) =>
      rootComments.some((comment) => comment.postId === post.id)
    ).length;

    const totalComments =
      rootComments.length + firstLevelReplies.length + deepReplies.length;

    const commentStats = {
      totalComments,
      postsWithComments,
      averageCommentsPerPost:
        postsWithComments > 0
          ? Math.round(totalComments / postsWithComments)
          : 0,
      commentCreationDuration: metrics.duration,
      commentDistribution: {
        totalRootComments: rootComments.length,
        totalFirstLevelReplies: firstLevelReplies.length,
        totalDeepReplies: deepReplies.length,
      },
    };

    logger.info(commentStats, "Comment creation phase completed");

    return commentStats;
  } catch (error) {
    return handleSeedingError(error, logger, "Comment creation", "comments", {
      totalUsers: users.length,
      totalPosts: posts.length,
    });
  }
};

export default seedComments;
