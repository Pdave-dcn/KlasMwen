/* eslint-disable max-lines-per-function */
import { faker } from "@faker-js/faker";

import prisma from "../../core/config/db.js";
import { createLogger } from "../../core/config/logger.js";
import { calculateMetrics, handleSeedingError } from "../utils/seedHelpers.js";

import type { Post, Prisma, User } from "@prisma/client";

const logger = createLogger({ module: "CommentSeeder" });

const seedComments = async (users: User[], posts: Post[]) => {
  try {
    logger.info("Comment creation phase started");
    const commentCreationStartTime = Date.now();

    // -------------------------------
    // PHASE 1: ROOT COMMENTS
    // -------------------------------
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

    // -------------------------------
    // PHASE 2: FIRST-LEVEL REPLIES
    // -------------------------------
    logger.debug("Creating first-level replies");
    const commentsEligibleForReplies = rootComments.filter(() =>
      faker.datatype.boolean({ probability: 0.3 })
    );

    const firstLevelRepliesData: Prisma.CommentUncheckedCreateInput[] = [];

    for (const parentComment of commentsEligibleForReplies) {
      const replyCount = faker.number.int({ min: 1, max: 6 });

      for (let i = 0; i < replyCount; i++) {
        const author = faker.helpers.arrayElement(users);

        firstLevelRepliesData.push({
          content: faker.lorem.sentences(faker.number.int({ min: 1, max: 2 })),
          postId: parentComment.postId,
          authorId: author.id,
          parentId: parentComment.id,
          mentionedUserId: null,
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

    // -------------------------------
    // PHASE 3: DEEP REPLIES (replies to replies)
    // -------------------------------
    logger.debug("Creating deep replies");
    const deepRepliesEligible = firstLevelReplies.filter(() =>
      faker.datatype.boolean({ probability: 0.15 })
    );

    const deepRepliesData: Prisma.CommentUncheckedCreateInput[] = [];

    for (const reply of deepRepliesEligible) {
      const deepReplyCount = faker.number.int({ min: 1, max: 3 });

      for (let i = 0; i < deepReplyCount; i++) {
        const author = faker.helpers.arrayElement(users);

        deepRepliesData.push({
          content: faker.lorem.sentences(faker.number.int({ min: 1, max: 2 })),
          postId: reply.postId,
          authorId: author.id,
          parentId: reply.parentId,
          mentionedUserId: reply.authorId,
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

    // -------------------------------
    // METRICS
    // -------------------------------
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
