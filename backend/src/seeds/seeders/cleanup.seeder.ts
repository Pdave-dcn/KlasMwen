import prisma from "../../core/config/db.js";
import { createLogger } from "../../core/config/logger.js";
import { handleSeedingError } from "../utils/seedHelpers.js";

const logger = createLogger({ module: "CleanupSeeder" });

/**
 * Clean up existing data from the database
 * @returns {Promise<Object>} Cleanup statistics
 */
const cleanupDatabase = async () => {
  logger.info("Database cleanup phase started");
  const cleanupStartTime = Date.now();

  try {
    const postTagDeleteCount = await prisma.postTag.deleteMany();

    const chatGroupTagDeleteCount = await prisma.circleTag.deleteMany();

    const avatarDeleteCount = await prisma.avatar.deleteMany();

    const likeDeleteCount = await prisma.like.deleteMany();

    const commentDeleteCount = await prisma.comment.deleteMany();

    const postDeleteCount = await prisma.post.deleteMany();

    const notificationsDeleteCount = await prisma.notification.deleteMany();

    const chatGroupDeleteCount = await prisma.circle.deleteMany();

    const chatGroupAvatarDeleteCount = await prisma.circleAvatar.deleteMany();

    const userDeleteCount = await prisma.user.deleteMany();

    const tagDeleteCount = await prisma.tag.deleteMany();

    const bookmarkDeleteCount = await prisma.bookmark.deleteMany();

    const reportReasonsDeleteCount = await prisma.reportReason.deleteMany();

    const reportsDeleteCount = await prisma.report.deleteMany();

    const cleanupDuration = Date.now() - cleanupStartTime;
    const cleanupStats = {
      postTagsDeleted: postTagDeleteCount.count,
      chatGroupTagsDeleted: chatGroupTagDeleteCount.count,
      reportReasonsDeleted: reportReasonsDeleteCount.count,
      likesDeleted: likeDeleteCount.count,
      commentsDeleted: commentDeleteCount.count,
      postsDeleted: postDeleteCount.count,
      usersDeleted: userDeleteCount.count,
      tagsDeleted: tagDeleteCount.count,
      avatarsDeleted: avatarDeleteCount.count,
      bookmarksDeleted: bookmarkDeleteCount.count,
      reportsDeleted: reportsDeleteCount.count,
      notificationsDeleted: notificationsDeleteCount.count,
      chatGroupsDeleted: chatGroupDeleteCount.count,
      chatGroupAvatarsDeleted: chatGroupAvatarDeleteCount.count,
      cleanupDuration,
    };

    logger.info(cleanupStats, "Database cleanup completed successfully");

    return cleanupStats;
  } catch (error) {
    return handleSeedingError(error, logger, "Database cleanup", "cleanup");
  }
};

export default cleanupDatabase;
