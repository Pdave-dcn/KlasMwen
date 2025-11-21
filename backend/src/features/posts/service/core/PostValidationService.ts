import {
  PostNotFoundError,
  PostUpdateFailedError,
} from "../../../../core/error/custom/post.error";
import PostRepository from "../repositories/postRepository";

import type { Prisma } from "@prisma/client";

/**
 * Handles validation logic for posts.
 * Centralizes all validation and business rule checks.
 */
export class PostValidationService {
  private static readonly EDIT_TIME_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Verify post exists and return essential data.
   * @throws {PostNotFoundError} if post doesn't exist
   */
  static async verifyPostExists(postId: string): Promise<
    Prisma.PostGetPayload<{
      select: {
        id: true;
        authorId: true;
        type: true;
        fileUrl: true;
        createdAt: true;
      };
    }>
  > {
    const post = await PostRepository.exists(postId);

    if (!post) {
      throw new PostNotFoundError(postId);
    }

    return post;
  }

  /**
   * Validate if post can be edited based on time constraints.
   * @throws {PostUpdateFailedError} if edit window expired
   */
  static validateEditTimeWindow(createdAt: Date, postId: string): void {
    const timeSinceCreation = Date.now() - new Date(createdAt).getTime();

    if (timeSinceCreation > this.EDIT_TIME_WINDOW_MS) {
      throw new PostUpdateFailedError(
        postId,
        "Edit time window has expired",
        403
      );
    }
  }
}
