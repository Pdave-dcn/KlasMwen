/* eslint-disable max-lines-per-function */
/* eslint-disable complexity */
import { faker } from "@faker-js/faker";

import prisma from "../../core/config/db.js";
import { createLogger } from "../../core/config/logger.js";
import { calculateMetrics, handleSeedingError } from "../utils/seedHelpers.js";

import type { Comment, Post, Prisma, ReportReason, User } from "@prisma/client";

const logger = createLogger({ module: "ReportSeeder" });

/**
 * Seeds reports for posts and comments with realistic distribution
 * @param users - Array of users who can report content
 * @param posts - Array of posts that can be reported
 * @param comments - Array of comments that can be reported
 * @param reasons - Array of available report reasons
 * @returns Statistics about created reports
 */
const seedReports = async (
  users: User[],
  posts: Post[],
  comments: Comment[],
  reasons: ReportReason[]
) => {
  try {
    logger.info("Report creation phase started");
    const reportCreationStartTime = Date.now();

    const reportsData: Prisma.ReportUncheckedCreateInput[] = [];

    // -------------------------------
    // PHASE 1: POST REPORTS
    // -------------------------------
    logger.debug("Creating post reports");

    // Select a random subset of posts to be reported (5-15% of total posts)
    const postsToReport = faker.helpers.arrayElements(
      posts,
      faker.number.int({
        min: Math.floor(posts.length * 0.05),
        max: Math.floor(posts.length * 0.15),
      })
    );

    for (const post of postsToReport) {
      // Each reported post gets 1-3 reports
      const reportCount = faker.number.int({ min: 1, max: 3 });

      for (let i = 0; i < reportCount; i++) {
        const reporter = faker.helpers.arrayElement(
          users.filter((u) => u.id !== post.authorId) // Users can't report their own posts
        );
        const reason = faker.helpers.arrayElement(reasons);

        // Higher probability for certain reasons
        const weightedReason = faker.helpers.weightedArrayElement([
          { weight: 3, value: reasons.find((r) => r.label === "Spam") },
          {
            weight: 2,
            value: reasons.find((r) => r.label === "Inappropriate Content"),
          },
          { weight: 2, value: reasons.find((r) => r.label === "Off-Topic") },
          { weight: 1, value: reason }, // fallback to random
        ]);

        reportsData.push({
          reporterId: reporter.id,
          postId: post.id,
          commentId: null,
          reasonId: weightedReason?.id ?? reason.id,
          status: faker.helpers.weightedArrayElement([
            { weight: 6, value: "PENDING" },
            { weight: 3, value: "REVIEWED" },
            { weight: 1, value: "DISMISSED" },
          ]),
          moderatorNotes: faker.datatype.boolean({ probability: 0.3 })
            ? faker.lorem.sentence()
            : null,
        });
      }
    }

    logger.info(
      {
        postsReported: postsToReport.length,
        postReportsCreated: reportsData.length,
      },
      "Post reports prepared"
    );

    // -------------------------------
    // PHASE 2: COMMENT REPORTS
    // -------------------------------
    logger.debug("Creating comment reports");

    // Select a random subset of comments to be reported (3-10% of total comments)
    const commentsToReport = faker.helpers.arrayElements(
      comments,
      faker.number.int({
        min: Math.floor(comments.length * 0.03),
        max: Math.floor(comments.length * 0.1),
      })
    );

    for (const comment of commentsToReport) {
      // Each reported comment typically gets 1-2 reports
      const reportCount = faker.number.int({ min: 1, max: 2 });

      for (let i = 0; i < reportCount; i++) {
        const reporter = faker.helpers.arrayElement(
          users.filter((u) => u.id !== comment.authorId) // Users can't report their own comments
        );
        const reason = faker.helpers.arrayElement(reasons);

        // Higher probability for certain reasons in comments
        const weightedReason = faker.helpers.weightedArrayElement([
          { weight: 3, value: reasons.find((r) => r.label === "Harassment") },
          { weight: 2, value: reasons.find((r) => r.label === "Hate Speech") },
          {
            weight: 2,
            value: reasons.find((r) => r.label === "Inappropriate Content"),
          },
          { weight: 1, value: reason }, // fallback to random
        ]);

        reportsData.push({
          reporterId: reporter.id,
          postId: null,
          commentId: comment.id,
          reasonId: weightedReason?.id ?? reason.id,
          status: faker.helpers.weightedArrayElement([
            { weight: 6, value: "PENDING" },
            { weight: 3, value: "REVIEWED" },
            { weight: 1, value: "DISMISSED" },
          ]),
          moderatorNotes: faker.datatype.boolean({ probability: 0.3 })
            ? faker.lorem.sentence()
            : null,
        });
      }
    }

    const totalCommentReports =
      reportsData.length - reportsData.filter((r) => r.postId !== null).length;

    logger.info(
      {
        commentsReported: commentsToReport.length,
        commentReportsCreated: totalCommentReports,
      },
      "Comment reports prepared"
    );

    // -------------------------------
    // PHASE 3: CREATE ALL REPORTS
    // -------------------------------
    logger.debug("Inserting reports into database");

    const createdReports = await prisma.report.createManyAndReturn({
      data: reportsData,
    });

    logger.info(
      {
        totalReportsCreated: createdReports.length,
      },
      "Reports created successfully"
    );

    // -------------------------------
    // METRICS
    // -------------------------------
    const metrics = calculateMetrics(
      reportCreationStartTime,
      createdReports.length
    );

    const postReports = createdReports.filter((r) => r.postId !== null);
    const commentReports = createdReports.filter((r) => r.commentId !== null);

    const statusDistribution = {
      pending: createdReports.filter((r) => r.status === "PENDING").length,
      reviewed: createdReports.filter((r) => r.status === "REVIEWED").length,
      dismissed: createdReports.filter((r) => r.status === "DISMISSED").length,
    };

    const reasonDistribution: Record<string, number> = {};
    for (const report of createdReports) {
      const reasonLabel =
        reasons.find((r) => r.id === report.reasonId)?.label ?? "Unknown";
      reasonDistribution[reasonLabel] =
        (reasonDistribution[reasonLabel] ?? 0) + 1;
    }

    const reportStats = {
      totalReports: createdReports.length,
      postReportsCount: postReports.length,
      commentReportsCount: commentReports.length,
      postsReported: postsToReport.length,
      commentsReported: commentsToReport.length,
      reportCreationDuration: metrics.duration,
      statusDistribution,
      reasonDistribution,
      reportsWithModeratorNotes: createdReports.filter(
        (r) => r.moderatorNotes !== null
      ).length,
    };

    logger.info(reportStats, "Report creation phase completed");
    return reportStats;
  } catch (error) {
    return handleSeedingError(error, logger, "Report creation", "reports", {
      totalUsers: users.length,
      totalPosts: posts.length,
      totalComments: comments.length,
      totalReasons: reasons.length,
    });
  }
};

export default seedReports;
