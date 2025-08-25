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
    logger.debug("Deleting existing post tags");
    const postTagDeleteCount = await prisma.postTag.deleteMany();

    logger.debug("Deleting existing avatars");
    const avatarDeleteCount = await prisma.avatar.deleteMany();

    logger.debug("Deleting existing likes");
    const likeDeleteCount = await prisma.like.deleteMany();

    logger.debug("Deleting existing comments");
    const commentDeleteCount = await prisma.comment.deleteMany();

    logger.debug("Deleting existing posts");
    const postDeleteCount = await prisma.post.deleteMany();

    logger.debug("Deleting existing users");
    const userDeleteCount = await prisma.user.deleteMany();

    logger.debug("Deleting existing tags");
    const tagDeleteCount = await prisma.tag.deleteMany();

    const cleanupDuration = Date.now() - cleanupStartTime;
    const cleanupStats = {
      postTagsDeleted: postTagDeleteCount.count,
      likesDeleted: likeDeleteCount.count,
      commentsDeleted: commentDeleteCount.count,
      postsDeleted: postDeleteCount.count,
      usersDeleted: userDeleteCount.count,
      tagsDeleted: tagDeleteCount.count,
      avatarsDeleted: avatarDeleteCount.count,
      cleanupDuration,
    };

    logger.info(cleanupStats, "Database cleanup completed successfully");

    return cleanupStats;
  } catch (error) {
    return handleSeedingError(error, logger, "Database cleanup", "cleanup");
  }
};

export default cleanupDatabase;
