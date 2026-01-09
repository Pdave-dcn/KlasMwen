/*eslint-disable*/
// @ts-nocheck
import { faker } from "@faker-js/faker";
import {
  NotificationType,
  type User,
  type Post,
  type Comment,
  type Like,
  type Report,
  type Prisma,
} from "@prisma/client";

import prisma from "../../core/config/db.js";
import { createLogger } from "../../core/config/logger.js";
import { calculateMetrics, handleSeedingError } from "../utils/seedHelpers.js";

const logger = createLogger({ module: "NotificationSeeder" });

interface NotificationStats {
  totalNotifications: number;
  typeDistribution: Record<NotificationType, number>;
  readRatio: string;
  seedingDuration: number;
}

/**
 * Seeds notifications based on existing interactions (Likes, Comments, Reports)
 */
const seedNotifications = async (
  users: User[],
  posts: Post[],
  comments: Comment[],
  likes: Like[],
  reports?: Report[]
) => {
  const seedingStartTime = Date.now();
  logger.info("Starting notification seeding process");

  try {
    const notificationsToCreate: Prisma.NotificationUncheckedCreateInput[] = [];
    const typeStats: Record<NotificationType, number> = {
      COMMENT_ON_POST: 0,
      REPLY_TO_COMMENT: 0,
      LIKE: 0,
      REPORT_UPDATE: 0,
    };

    // 1. Collect LIKE notifications
    for (const like of likes) {
      const post = posts.find((p) => p.id === like.postId);
      if (post && post.authorId !== like.userId) {
        notificationsToCreate.push({
          type: NotificationType.LIKE,
          userId: post.authorId,
          actorId: like.userId,
          postId: post.id,
          read: faker.datatype.boolean({ probability: 0.7 }),
          createdAt: null, // Will be assigned after shuffle
        });
        typeStats.LIKE++;
      }
    }

    // 2. Collect COMMENT notifications
    for (const comment of comments) {
      const post = posts.find((p) => p.id === comment.postId);

      if (comment.parentId) {
        // Reply Scenario
        const parentComment = comments.find((c) => c.id === comment.parentId);
        if (parentComment && parentComment.authorId !== comment.authorId) {
          notificationsToCreate.push({
            type: NotificationType.REPLY_TO_COMMENT,
            userId: parentComment.authorId,
            actorId: comment.authorId,
            postId: comment.postId,
            commentId: comment.id,
            read: faker.datatype.boolean({ probability: 0.4 }),
            createdAt: null, // Will be assigned after shuffle
          });
          typeStats.REPLY_TO_COMMENT++;
        }
      } else if (post && post.authorId !== comment.authorId) {
        // Root Comment Scenario
        notificationsToCreate.push({
          type: NotificationType.COMMENT_ON_POST,
          userId: post.authorId,
          actorId: comment.authorId,
          postId: post.id,
          commentId: comment.id,
          read: faker.datatype.boolean({ probability: 0.5 }),
          createdAt: null, // Will be assigned after shuffle
        });
        typeStats.COMMENT_ON_POST++;
      }
    }

    // 3. Collect REPORT notifications (only if reports are provided)
    if (reports && reports.length > 0) {
      const reportsToNotify = reports.filter(() =>
        faker.datatype.boolean({ probability: 0.3 })
      );
      const systemAdmin = users.find((u) => u.role === "ADMIN") ?? users[0];

      for (const report of reportsToNotify) {
        notificationsToCreate.push({
          type: NotificationType.REPORT_UPDATE,
          userId: report.reporterId,
          actorId: systemAdmin.id,
          read: faker.datatype.boolean({ probability: 0.2 }),
          createdAt: null, // Will be assigned after shuffle
        });
        typeStats.REPORT_UPDATE++;
      }
    }

    // Shuffle notifications to simulate realistic chronological ordering
    const shuffledNotifications = faker.helpers.shuffle(notificationsToCreate);

    // Assign sequential timestamps to shuffled notifications
    const now = new Date();
    shuffledNotifications.forEach((notification, index) => {
      // Spread notifications over the last 7 days
      const minutesAgo = (index / shuffledNotifications.length) * 7 * 24 * 60;
      notification.createdAt = new Date(now.getTime() - minutesAgo * 60 * 1000);
    });

    logger.info(
      `Inserting ${shuffledNotifications.length} notifications in randomized order...`
    );

    // Batch insert with shuffled order
    await prisma.notification.createMany({
      data: shuffledNotifications,
      skipDuplicates: true,
    });

    const metrics = calculateMetrics(
      seedingStartTime,
      shuffledNotifications.length
    );
    const readCount = shuffledNotifications.filter((n) => n.read).length;

    const stats: NotificationStats = {
      totalNotifications: shuffledNotifications.length,
      typeDistribution: typeStats,
      readRatio: `${((readCount / shuffledNotifications.length) * 100).toFixed(
        1
      )}%`,
      seedingDuration: metrics.duration,
    };

    logger.info(stats, "Notification seeding completed");
    return stats;
  } catch (error) {
    return handleSeedingError(
      error,
      logger,
      "Notification seeding",
      "notifications"
    );
  }
};

export default seedNotifications;
