import NotificationService from "../../notification/service/NotificationService.js";
import PostService from "../../posts/service/PostService.js";

import ReactionRepository from "./ReactionRepository.js";

import type { Application } from "express";

interface ToggleLikeResult {
  action: "like" | "unlike";
  message: string;
}

/**
 * ReactionService - Business logic for post reactions (likes)
 */
class ReactionService {
  /**
   * Toggle like on a post
   * If like exists, remove it. If not, create it.
   */
  static async toggleLike(
    userId: string,
    postId: string,
    app?: Application
  ): Promise<ToggleLikeResult> {
    // Verify post exists and get author
    const post = await PostService.verifyPostExists(postId);

    // Check if like already exists
    const existingLike = await ReactionRepository.findLike(userId, postId);

    if (existingLike) {
      // Unlike
      await ReactionRepository.deleteLike(userId, postId);

      return {
        action: "unlike",
        message: "Post unliked successfully",
      };
    }

    // Like
    await ReactionRepository.createLike(userId, postId);

    // Send notification
    await NotificationService.createNotification(
      {
        type: "LIKE",
        userId: post.authorId,
        actorId: userId,
        postId,
      },
      app
    );

    return {
      action: "like",
      message: "Post liked successfully",
    };
  }
}

export default ReactionService;
