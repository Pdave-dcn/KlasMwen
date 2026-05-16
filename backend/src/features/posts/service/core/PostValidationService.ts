import {
  PostNotFoundError,
  PostUpdateFailedError,
} from "../../../../core/error/custom/post.error.js";
import {
  postRepository,
  type IPostRepository,
} from "../repositories/postRepository.js";

import type { Prisma } from "@prisma/client";

interface IPostValidationService {
  verifyPostExists(postId: string): Promise<
    Prisma.PostGetPayload<{
      select: {
        id: true;
        authorId: true;
        type: true;
        fileUrl: true;
        createdAt: true;
      };
    }>
  >;
  validateEditTimeWindow(createdAt: Date, postId: string): void;
}

class PostValidationService implements IPostValidationService {
  private static readonly EDIT_TIME_WINDOW_MS = 5 * 60 * 1000;

  constructor(private repository: IPostRepository) {}

  async verifyPostExists(postId: string): Promise<
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
    const post = await this.repository.validate.exists(postId);

    if (!post) {
      throw new PostNotFoundError(postId);
    }

    return post;
  }

  validateEditTimeWindow(createdAt: Date, postId: string): void {
    const timeSinceCreation = Date.now() - new Date(createdAt).getTime();

    if (timeSinceCreation > PostValidationService.EDIT_TIME_WINDOW_MS) {
      throw new PostUpdateFailedError(
        postId,
        "Edit time window has expired",
        403,
      );
    }
  }
}

const postValidationService = new PostValidationService(postRepository);
export { postValidationService, type IPostValidationService };
