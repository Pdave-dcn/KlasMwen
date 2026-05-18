import { notificationService as NotificationService } from "../../notification/service/index.js";
import { postService } from "../../posts/service/PostService.js";

import ReactionRepository from "./ReactionRepository.js";

import type { Application } from "express";

interface ToggleLikeResult {
  action: "like" | "unlike";
  message: string;
}

class ReactionService {
  async toggleLike(
    userId: string,
    postId: string,
    app?: Application,
  ): Promise<ToggleLikeResult> {
    const post = await postService.validate.verifyPostExists(postId);

    const existingLike = await ReactionRepository.findLike(userId, postId);

    if (existingLike) {
      await ReactionRepository.deleteLike(userId, postId);

      return {
        action: "unlike",
        message: "Post unliked successfully",
      };
    }

    await ReactionRepository.createLike(userId, postId);

    await NotificationService.createNotification(
      {
        type: "LIKE",
        userId: post.authorId,
        actorId: userId,
        postId,
      },
      app,
    );

    return {
      action: "like",
      message: "Post liked successfully",
    };
  }
}

const reactionService = new ReactionService();
export { reactionService, ReactionService };
