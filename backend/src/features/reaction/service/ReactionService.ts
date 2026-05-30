import { eventBus } from "../../../core/events/EventBus.js";
import { postService } from "../../posts/service/PostService.js";

import ReactionRepository from "./ReactionRepository.js";

import type { PostLikedEvent } from "../../../core/events/types.js";

interface ToggleLikeResult {
  action: "like" | "unlike";
  message: string;
}

class ReactionService {
  async toggleLike(userId: string, postId: string): Promise<ToggleLikeResult> {
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

    const event: PostLikedEvent = {
      type: "post:liked",
      postId,
      postAuthorId: post.authorId,
      actorId: userId,
    };

    eventBus.emit(event);

    return {
      action: "like",
      message: "Post liked successfully",
    };
  }
}

const reactionService = new ReactionService();
export { reactionService, ReactionService };
