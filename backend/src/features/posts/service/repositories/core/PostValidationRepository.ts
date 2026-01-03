import prisma from "../../../../../core/config/db.js";

import type { Prisma } from "@prisma/client";

/**
 * PostValidationRepository - Validation/existence checks
 */
class PostValidationRepository {
  /**
   * Check if a post exists by ID
   */
  static async exists(postId: string): Promise<Prisma.PostGetPayload<{
    select: {
      id: true;
      authorId: true;
      type: true;
      fileUrl: true;
      createdAt: true;
    };
  }> | null> {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        authorId: true,
        type: true,
        fileUrl: true,
        createdAt: true,
      },
    });
    return post;
  }
}

export default PostValidationRepository;
