/*eslint-disable max-lines-per-function*/
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
  reports: Report[]
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

    // 1. Process LIKES -> Post Authors
    for (const like of likes) {
      const post = posts.find((p) => p.id === like.postId);
      if (post && post.authorId !== like.userId) {
        notificationsToCreate.push({
          type: NotificationType.LIKE,
          userId: post.authorId,
          actorId: like.userId,
          postId: post.id,
          read: faker.datatype.boolean({ probability: 0.7 }),
          createdAt: faker.date.recent({ days: 7 }),
        });
        typeStats.LIKE++;
      }
    }

    // 2. Process COMMENTS -> Post Authors & Parent Comment Authors
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
            createdAt: comment.createdAt,
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
          createdAt: comment.createdAt,
        });
        typeStats.COMMENT_ON_POST++;
      }
    }

    // 3. Process REPORTS -> Reporters (Simulating a status update)
    // Only notify for a subset of reports to simulate activity
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
        createdAt: faker.date.recent({ days: 2 }),
      });
      typeStats.REPORT_UPDATE++;
    }

    logger.info(`Inserting ${notificationsToCreate.length} notifications...`);

    // Batch insert
    await prisma.notification.createMany({
      data: notificationsToCreate,
      skipDuplicates: true,
    });

    const metrics = calculateMetrics(
      seedingStartTime,
      notificationsToCreate.length
    );
    const readCount = notificationsToCreate.filter((n) => n.read).length;

    const stats: NotificationStats = {
      totalNotifications: notificationsToCreate.length,
      typeDistribution: typeStats,
      readRatio: `${((readCount / notificationsToCreate.length) * 100).toFixed(
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
