import prisma from "../../../core/config/db.js";

/**
 * ReactionRepository - Data access layer for likes
 */
class ReactionRepository {
  /**
   * Find an existing like
   */
  static findLike(userId: string, postId: string) {
    return prisma.like.findUnique({
      where: { userId_postId: { userId, postId } },
    });
  }

  /**
   * Create a like
   */
  static createLike(userId: string, postId: string) {
    return prisma.like.create({
      data: { userId, postId },
    });
  }

  /**
   * Delete a like
   */
  static deleteLike(userId: string, postId: string) {
    return prisma.like.delete({
      where: { userId_postId: { userId, postId } },
    });
  }
}

export default ReactionRepository;
